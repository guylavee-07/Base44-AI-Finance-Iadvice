import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, TrendingUp, AlertTriangle, Newspaper, Target, Sparkles, Check, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPageUrl } from '@/utils';
import moment from 'moment';

const typeIcons = {
    market_update: TrendingUp,
    opportunity: Sparkles,
    risk_alert: AlertTriangle,
    news: Newspaper,
    personal: Target
};

const typeColors = {
    market_update: "text-blue-600 bg-blue-50",
    opportunity: "text-emerald-600 bg-emerald-50",
    risk_alert: "text-red-600 bg-red-50",
    news: "text-purple-600 bg-purple-50",
    personal: "text-amber-600 bg-amber-50"
};

const priorityColors = {
    high: "border-r-4 border-red-500",
    medium: "border-r-4 border-amber-500",
    low: "border-r-4 border-slate-300"
};

export default function AlertBell({ userEmail }) {
    const [alerts, setAlerts] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (userEmail) {
            loadAlerts();
            const interval = setInterval(loadAlerts, 60000); // Refresh every minute
            return () => clearInterval(interval);
        }
    }, [userEmail]);

    const loadAlerts = async () => {
        try {
            const data = await base44.entities.Alert.filter(
                { user_email: userEmail },
                '-created_date',
                20
            );
            setAlerts(data);
        } catch (error) {
            console.error('Error loading alerts:', error);
        }
    };

    const markAsRead = async (alertId) => {
        try {
            await base44.entities.Alert.update(alertId, { is_read: true });
            setAlerts(prev => prev.map(a => 
                a.id === alertId ? { ...a, is_read: true } : a
            ));
        } catch (error) {
            console.error('Error marking alert as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unreadAlerts = alerts.filter(a => !a.is_read);
            await Promise.all(unreadAlerts.map(a => 
                base44.entities.Alert.update(a.id, { is_read: true })
            ));
            setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const unreadCount = alerts.filter(a => !a.is_read).length;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5 text-slate-600" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end" dir="rtl">
                <div className="flex items-center justify-between p-3 border-b">
                    <h3 className="font-semibold text-slate-800">התראות</h3>
                    <div className="flex gap-1">
                        {unreadCount > 0 && (
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={markAllAsRead}
                                className="text-xs text-sky-600 hover:text-sky-700"
                            >
                                <Check className="h-3 w-3 ml-1" />
                                סמן הכל כנקרא
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.location.href = createPageUrl('AlertSettings')}
                        >
                            <Settings className="h-4 w-4 text-slate-500" />
                        </Button>
                    </div>
                </div>
                
                <ScrollArea className="h-80">
                    {alerts.length === 0 ? (
                        <div className="p-6 text-center text-slate-500">
                            <Bell className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                            <p>אין התראות חדשות</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {alerts.map((alert) => {
                                const Icon = typeIcons[alert.type] || Bell;
                                return (
                                    <div
                                        key={alert.id}
                                        className={cn(
                                            "p-3 hover:bg-slate-50 cursor-pointer transition-colors",
                                            !alert.is_read && "bg-sky-50/50",
                                            priorityColors[alert.priority]
                                        )}
                                        onClick={() => markAsRead(alert.id)}
                                    >
                                        <div className="flex gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                                typeColors[alert.type]
                                            )}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className={cn(
                                                        "text-sm",
                                                        !alert.is_read ? "font-semibold text-slate-800" : "text-slate-600"
                                                    )}>
                                                        {alert.title}
                                                    </h4>
                                                    {!alert.is_read && (
                                                        <div className="w-2 h-2 bg-sky-500 rounded-full flex-shrink-0 mt-1.5" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                                                    {alert.message}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {moment(alert.created_date).fromNow()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}