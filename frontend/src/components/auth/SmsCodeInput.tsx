import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Shield, KeyRound, RotateCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '../../services/authService';

interface SmsCodeInputProps {
  phone: string;
  onPhoneChange: (val: string) => void;
  smsCode: string;
  onSmsCodeChange: (val: string) => void;
  onSendSuccessNotification?: (msg: string) => void;
  onSwitchToPasswordLogin?: () => void;
}

export const SmsCodeInput: React.FC<SmsCodeInputProps> = ({
  phone,
  onPhoneChange,
  smsCode,
  onSmsCodeChange,
  onSendSuccessNotification,
  onSwitchToPasswordLogin
}) => {
  // 防刷图形验证码
  const [captchaCode, setCaptchaCode] = useState<string>('');
  const [captchaInput, setCaptchaInput] = useState<string>('');
  const [isCaptchaValid, setIsCaptchaValid] = useState<boolean>(true);

  // 60s 短信倒计时状态
  const [countdown, setCountdown] = useState<number>(0);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendNotice, setSendNotice] = useState<string | null>(null);

  // 生成4位随机防刷图形校验码
  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let res = '';
    for (let i = 0; i < 4; i++) {
      res += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptchaCode(res);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // 倒计时计时器
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) clearInterval(timer);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // 发送短信验证码
  const handleSendCode = async () => {
    if (!phone) {
      setSendNotice('请先输入11位手机号码');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setSendNotice('手机号码格式不正确，请输入有效的11位号码');
      return;
    }

    // 校验防刷图形码
    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setIsCaptchaValid(false);
      setSendNotice('图形防刷码输入有误，请重新输入');
      return;
    }
    setIsCaptchaValid(true);

    try {
      setIsSending(true);
      setSendNotice(null);
      const res = await authService.sendSmsCode(phone);
      if (res.success) {
        setCountdown(60);
        const notice = `【三亚数字孪生验证码】${res.mockCode}（5分钟内有效，老年便民绿色通道）`;
        setSendNotice(notice);
        if (onSendSuccessNotification) {
          onSendSuccessNotification(notice);
        }
        // 如果是演示模式，自动填充方便体验
        if (res.mockCode) {
          onSmsCodeChange(res.mockCode);
        }
      } else {
        setSendNotice(res.message);
      }
    } catch (e) {
      setSendNotice('发送失败，请稍后重试');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* 绿色便民通道提示卡 */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-medium">绿色便民通道 · 老年患者免密友好</span>
        </div>
        {onSwitchToPasswordLogin && (
          <button
            type="button"
            onClick={onSwitchToPasswordLogin}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2 ml-2 transition"
          >
            使用密码登录
          </button>
        )}
      </div>

      {/* 1. 手机号码输入 */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">
          大陆手机号 <span className="text-cyan-400">*</span>
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-3 flex items-center gap-1 text-slate-400 text-xs font-mono border-r border-slate-700 pr-2">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>+86</span>
          </div>
          <input
            type="tel"
            maxLength={11}
            value={phone}
            onChange={e => onPhoneChange(e.target.value.replace(/\D/g, ''))}
            placeholder="请输入就诊登记手机号码"
            className="w-full pl-20 pr-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-100 placeholder:text-slate-500 text-sm font-mono tracking-wider transition outline-none h-11"
          />
        </div>
      </div>

      {/* 2. 防刷图形验证码 */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
          <span>防刷图形验证</span>
          <span className="text-[10px] text-slate-500">点击图片更换</span>
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              maxLength={4}
              value={captchaInput}
              onChange={e => {
                setCaptchaInput(e.target.value);
                setIsCaptchaValid(true);
              }}
              placeholder="输入图形4位字母数字"
              className={`w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border text-slate-100 placeholder:text-slate-500 text-sm font-mono uppercase tracking-widest outline-none transition h-11 ${
                !isCaptchaValid
                  ? 'border-rose-500 focus:border-rose-400'
                  : 'border-slate-700/80 focus:border-cyan-400'
              }`}
            />
          </div>

          {/* 拟态防刷图形码展示块 */}
          <div
            onClick={generateCaptcha}
            title="点击更换验证码"
            className="w-28 h-11 rounded-xl bg-gradient-to-r from-slate-800 to-cyan-950/80 border border-cyan-800/50 flex items-center justify-center cursor-pointer select-none relative overflow-hidden group hover:border-cyan-400 transition"
          >
            {/* 随机斜线噪点 */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:6px_6px]"></div>
            <span className="text-base font-extrabold tracking-widest text-cyan-300 font-mono italic select-none">
              {captchaCode}
            </span>
            <RotateCw className="w-3 h-3 text-cyan-400/60 absolute right-1.5 bottom-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* 3. 6位短信验证码输入 + 倒计时按钮 */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">
          短信验证码 <span className="text-cyan-400">*</span>
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              maxLength={6}
              value={smsCode}
              onChange={e => onSmsCodeChange(e.target.value.replace(/\D/g, ''))}
              placeholder="请输入6位验证码"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-100 placeholder:text-slate-500 text-sm font-mono tracking-widest outline-none transition h-11"
            />
          </div>

          <button
            type="button"
            disabled={countdown > 0 || isSending}
            onClick={handleSendCode}
            className={`h-11 px-4 rounded-xl text-xs font-medium border flex items-center justify-center shrink-0 transition min-w-[110px] active:scale-95 ${
              countdown > 0
                ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 border-cyan-600/60 shadow-md shadow-cyan-950/50 hover:border-cyan-400'
            }`}
          >
            {isSending ? (
              <span className="flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>发送中</span>
              </span>
            ) : countdown > 0 ? (
              <span className="font-mono">{countdown}s 后重新发送</span>
            ) : (
              <span>获取验证码</span>
            )}
          </button>
        </div>
      </div>

      {/* 动态微提示横幅 */}
      {sendNotice && (
        <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-800/60 text-cyan-200 text-xs flex items-start gap-1.5 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span className="leading-tight">{sendNotice}</span>
        </div>
      )}
    </div>
  );
};
