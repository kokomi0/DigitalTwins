import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Smartphone, Wifi, Copy, Check, ExternalLink, QrCode, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeModal({ isOpen, onClose }: QRCodeModalProps) {
  const [ip, setIp] = useState<string>('');
  const [allIps, setAllIps] = useState<string[]>([]);
  const [port, setPort] = useState<number>(3000);
  const [copied, setCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchNetInfo = async () => {
      setIsLoading(true);
      try {
        const netInfo = await api.getNetworkInfo();
        if (netInfo) {
          setIp(netInfo.preferred_ip || window.location.hostname || '10.108.4.46');
          setAllIps(netInfo.all_ips || [netInfo.preferred_ip]);
          setPort(netInfo.frontend_port || Number(window.location.port) || 3000);
        }
      } catch (e) {
        setIp(window.location.hostname !== 'localhost' ? window.location.hostname : '10.108.4.46');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNetInfo();
  }, [isOpen]);

  if (!isOpen) return null;

  // 构造手机端访问 URL
  const mobileUrl = `http://${ip || '10.108.4.46'}:${port}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(mobileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900/95 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Modal 顶部标题栏 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>手机扫码实时同步访问</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                  触控响应式
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                局域网直连 · 全屏3D肺部交互与临床抽屉
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal 内容区域 */}
        <div className="p-5 flex flex-col items-center gap-4">
          {/* 二维码容器 (白色内衬确保相机极速识别) */}
          <div className="relative p-3 rounded-2xl bg-white shadow-xl shadow-cyan-950/40 border-2 border-cyan-400/30 flex items-center justify-center">
            {isLoading ? (
              <div className="w-[180px] h-[180px] flex items-center justify-center text-slate-400 text-xs">
                正在检测网络地址...
              </div>
            ) : (
              <QRCodeSVG
                value={mobileUrl}
                size={180}
                level="M"
                bgColor="#ffffff"
                fgColor="#0f172a"
                includeMargin={false}
              />
            )}
          </div>

          {/* 扫码快速提示 */}
          <div className="text-center space-y-1">
            <p className="text-xs font-semibold text-cyan-300 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              手机相机 / 微信扫一扫即可直接打开
            </p>
            <p className="text-[11px] text-slate-400">
              手机将自动切换为「全屏3D触控 + 底部上拉抽屉」模式
            </p>
          </div>

          {/* 访问地址与一键复制 */}
          <div className="w-full space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>手机端直达网址 (局域网 IP):</span>
              {allIps.length > 1 && (
                <div className="flex items-center gap-1 text-[10px] text-cyan-400">
                  <span>切换网卡:</span>
                  <select
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-cyan-300 rounded px-1 py-0.5 outline-none"
                  >
                    {allIps.map((netIp) => (
                      <option key={netIp} value={netIp}>
                        {netIp}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={mobileUrl}
                onChange={(e) => {
                  try {
                    const u = new URL(e.target.value);
                    setIp(u.hostname);
                    setPort(Number(u.port) || 3000);
                  } catch (_) {}
                }}
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-300 outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition shrink-0 shadow"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '已复制' : '复制'}</span>
              </button>
            </div>
          </div>

          {/* 扫码步骤三要素 */}
          <div className="w-full grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col items-center text-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-slate-200">1. 同一Wi-Fi</span>
              <span className="text-[10px] text-slate-400">手机与电脑连同一无线或热点</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col items-center text-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-slate-200">2. 扫码打开</span>
              <span className="text-[10px] text-slate-400">微信或手机浏览器扫描</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col items-center text-center gap-1">
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-slate-200">3. 触控交互</span>
              <span className="text-[10px] text-slate-400">单指旋转·双指缩放·拖拽抽屉</span>
            </div>
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/50 flex justify-between items-center text-[11px] text-slate-400">
          <span>如无法打开，请检查电脑防火墙放行 3000 端口</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
