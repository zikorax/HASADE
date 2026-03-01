'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, AlertCircle, CheckCircle } from 'lucide-react'

// Elon Musk styled high-productivity timer
// Dark mode / Data dense / Laser focused

interface PomodoroTimerProps {
    onSessionComplete: () => void;
    pomodorosCompleted: number;
    autoStart?: boolean;
    taskTitle?: string;
    onTick?: (secondsSpent: number) => void;
}

export function PomodoroTimer({ onSessionComplete, pomodorosCompleted, autoStart = false, taskTitle, onTick }: PomodoroTimerProps) {
    const FOCUS_TIME = 25 * 60; // 25 minutes
    const BREAK_TIME = 5 * 60;  // 5 minutes

    const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
    const [isActive, setIsActive] = useState(autoStart);
    const [isBreak, setIsBreak] = useState(false);

    const playAlarm = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();

            const createBeep = (freq: number, timeOffset: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + timeOffset);
                gain.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
                gain.gain.linearRampToValueAtTime(1, ctx.currentTime + timeOffset + 0.05);
                gain.gain.setValueAtTime(1, ctx.currentTime + timeOffset + 0.15);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + timeOffset + 0.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + timeOffset);
                osc.stop(ctx.currentTime + timeOffset + 0.25);
            };

            createBeep(880, 0);       // A5
            createBeep(1046.50, 0.3); // C6
            createBeep(880, 0.6);     // A5
        } catch (e) {
            console.error('Audio play failed', e);
        }
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
                if (!isBreak && onTick) {
                    onTick(1);
                }
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            // Timer finished!
            setIsActive(false);

            // Try to play sound
            playAlarm();

            if (!isBreak) {
                // Finished focus session
                onSessionComplete();
                setIsBreak(true);
                setTimeLeft(BREAK_TIME);
            } else {
                // Finished break
                setIsBreak(false);
                setTimeLeft(FOCUS_TIME);
            }
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft, isBreak, onSessionComplete, BREAK_TIME, FOCUS_TIME]);

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setIsBreak(false);
        setTimeLeft(FOCUS_TIME);
    };

    const skipBreak = () => {
        setIsActive(false);
        setIsBreak(false);
        setTimeLeft(FOCUS_TIME);
    }

    // Format MM:SS
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const percentage = isBreak
        ? ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100
        : ((FOCUS_TIME - timeLeft) / FOCUS_TIME) * 100;

    return (
        <div className="bg-slate-900 text-white rounded-[24px] overflow-hidden shadow-2xl shadow-indigo-500/10 border border-slate-800 p-6 relative group">
            {/* Background Progress visualizer */}
            <div
                className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-1000 ease-linear"
                style={{ width: `${percentage}%` }}
            />
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -z-10 rounded-full" />

            <div className="flex flex-col items-center">
                <div className="flex w-full justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isActive ? (isBreak ? 'bg-amber-400' : 'bg-red-500') : 'bg-slate-600'}`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? (isBreak ? 'bg-amber-500' : 'bg-red-500') : 'bg-slate-500'}`}></span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {isBreak ? 'فترة راحة' : 'تركيز عميق'}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 tracking-widest bg-slate-800/50 px-3 py-1.5 rounded-full">
                        <CheckCircle size={12} className="text-emerald-400" />
                        {pomodorosCompleted} دورات منجزة
                    </div>
                </div>

                {taskTitle && (
                    <div className="w-full mb-4 animate-in slide-in-from-top-2 duration-300">
                        <h2 className="text-lg font-black text-indigo-100 leading-tight line-clamp-1">{taskTitle}</h2>
                    </div>
                )}

                <div className="relative flex items-center justify-center w-40 h-40 mb-6 group-hover:scale-105 transition-transform duration-500">
                    {/* Subtle Ring pattern */}
                    <svg className="w-full h-full -rotate-90 absolute inset-0" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="2" className="text-slate-800" />
                        <circle
                            cx="50" cy="50" r="46"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 46}
                            strokeDashoffset={2 * Math.PI * 46 * (1 - (percentage / 100))}
                            className={`${isBreak ? 'text-amber-500' : 'text-indigo-500'} transition-all duration-1000 ease-linear`}
                        />
                    </svg>
                    <div className="z-10 flex flex-col items-center">
                        <span className="text-5xl font-black tabular-nums tracking-tighter text-white">
                            {formatTime(timeLeft)}
                        </span>
                        {isBreak && <span className="text-amber-500 text-[10px] font-bold mt-1 uppercase tracking-widest">Break</span>}
                        {!isBreak && isActive && <span className="text-indigo-400 text-[10px] font-bold mt-1 uppercase tracking-widest">Focus</span>}
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full justify-center">
                    {isBreak ? (
                        <button
                            onClick={skipBreak}
                            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors text-xs"
                        >
                            تخطي الراحة
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={toggleTimer}
                                className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all shadow-lg active:scale-95 ${isActive ? 'bg-slate-800 text-amber-500 hover:bg-slate-700' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20'}`}
                            >
                                {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                            </button>

                            <button
                                onClick={resetTimer}
                                disabled={!isActive && timeLeft === FOCUS_TIME}
                                className="w-14 h-14 flex items-center justify-center rounded-2xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-50 disabled:hover:bg-slate-800 disabled:hover:text-slate-400"
                            >
                                <Square size={20} fill="currentColor" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
