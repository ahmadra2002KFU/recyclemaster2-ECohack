
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LiveServerMessage } from '@google/genai';
import { LiveChatSession } from '../../services/geminiService';
import { ChatMessage } from '../../types';
import { Icon } from '../Icon';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getThemeClasses } from '../../utils/themeConfig';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

const SupportChatbot: React.FC = () => {
    const { theme } = useTheme();
    const { t, isRTL } = useLanguage();
    const colors = getThemeClasses(theme);

    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [currentUserInput, setCurrentUserInput] = useState('');
    const [currentModelOutput, setCurrentModelOutput] = useState('');

    const liveChatSessionRef = useRef<LiveChatSession | null>(null);
    const historyEndRef = useRef<HTMLDivElement>(null);

    const onMessage = useCallback((message: LiveServerMessage) => {
        if (message.serverContent?.inputTranscription) {
            setCurrentUserInput(prev => prev + message.serverContent.inputTranscription.text);
        }
        if (message.serverContent?.outputTranscription) {
            setCurrentModelOutput(prev => prev + message.serverContent.outputTranscription.text);
        }
        if (message.serverContent?.turnComplete) {
            setHistory(prev => {
                const newHistory: ChatMessage[] = [...prev];
                if (currentUserInput.trim()) {
                    newHistory.push({ speaker: 'user', text: currentUserInput.trim() });
                }
                if (currentModelOutput.trim()) {
                    newHistory.push({ speaker: 'model', text: currentModelOutput.trim() });
                }
                return newHistory;
            });
            setCurrentUserInput('');
            setCurrentModelOutput('');
        }
    }, [currentUserInput, currentModelOutput]);
    
    const onError = useCallback((e: ErrorEvent) => {
        console.error("Live session error:", e);
        setConnectionState('error');
    }, []);

    const onClose = useCallback((e: CloseEvent) => {
        setConnectionState('disconnected');
    }, []);

    const onOpen = useCallback(() => {
        setConnectionState('connected');
    }, []);

    const connect = useCallback(async () => {
        setConnectionState('connecting');
        if (!liveChatSessionRef.current) {
            liveChatSessionRef.current = new LiveChatSession();
        }
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            liveChatSessionRef.current.connect(onMessage, onError, onClose, onOpen);
        } catch (err) {
            console.error("Microphone access denied:", err);
            setConnectionState('error');
        }
    }, [onMessage, onError, onClose, onOpen]);
    
    const disconnect = useCallback(async () => {
        liveChatSessionRef.current?.disconnect();
        liveChatSessionRef.current = null;
        setConnectionState('disconnected');
    }, []);

    useEffect(() => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, currentUserInput, currentModelOutput]);

    return (
        <div className={`p-4 ${colors.bgCard} rounded-2xl shadow-lg h-full flex flex-col`}>
            <div className={`flex-1 overflow-y-auto space-y-4 ${isRTL ? 'pl-2' : 'pr-2'}`}>
                {history.map((msg, index) => (
                    <div key={index} className={`flex ${msg.speaker === 'user' ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${
                            msg.speaker === 'user'
                                ? `${theme === 'dark' ? 'bg-green-600' : 'bg-green-600'} text-white ${isRTL ? 'rounded-bl-none' : 'rounded-br-none'}`
                                : `${colors.bgTertiary} ${colors.textSecondary} ${isRTL ? 'rounded-br-none' : 'rounded-bl-none'}`
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {currentUserInput && (
                    <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${theme === 'dark' ? 'bg-green-600/50 text-white/80' : 'bg-green-600/50 text-white/90'} ${isRTL ? 'rounded-bl-none' : 'rounded-br-none'} italic`}>
                            {currentUserInput}
                        </div>
                    </div>
                )}
                 {currentModelOutput && (
                    <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${theme === 'dark' ? 'bg-gray-700/50 text-gray-200/80' : 'bg-gray-200/50 text-gray-700/80'} ${isRTL ? 'rounded-br-none' : 'rounded-bl-none'} italic`}>
                            {currentModelOutput}
                        </div>
                    </div>
                )}
                <div ref={historyEndRef} />
            </div>
            <div className={`pt-4 border-t ${colors.borderPrimary} flex flex-col items-center`}>
                 {connectionState === 'disconnected' && (
                    <button onClick={connect} className={`px-6 py-3 ${colors.accentBlue} ${colors.accentBlueHover} rounded-full font-bold text-white transition-colors flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                        <Icon name="microphone" />
                        <span>{t('ai.startConversation')}</span>
                    </button>
                 )}
                 {connectionState === 'connecting' && <p className={colors.textTertiary}>{t('ai.connecting')}</p>}
                 {connectionState === 'connected' && (
                     <button onClick={disconnect} className={`px-6 py-3 ${colors.accentRed} ${colors.accentRedHover} rounded-full font-bold text-white transition-colors flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                        <Icon name="stop" />
                        <span>{t('ai.endConversation')}</span>
                    </button>
                 )}
                 {connectionState === 'error' && (
                     <div className="text-center">
                        <p className="text-red-400">{t('ai.connectionFailed')}</p>
                        <button onClick={connect} className={`mt-2 px-4 py-2 ${colors.accentBlue} ${colors.accentBlueHover} rounded-md`}>{t('ai.retry')}</button>
                     </div>
                 )}
            </div>
        </div>
    );
};

export default SupportChatbot;
