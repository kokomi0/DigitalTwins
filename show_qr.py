# -*- coding: utf-8 -*-
"""
人体数字孪生（肺部）交互系统 - 移动端扫码访问辅助脚本
自动检测当前电脑局域网 IP，并在终端打印 ASCII 二维码与访问 URL
"""
import sys
import socket

# 确保在 Windows 控制台能正确输出 UTF-8 特殊字符
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def get_network_ips():
    all_ips = []
    try:
        _, _, ips = socket.gethostbyname_ex(socket.gethostname())
        for ip in ips:
            if not ip.startswith(('127.', '169.254.')):
                all_ips.append(ip)
    except Exception:
        pass
    
    # 优先推荐真实物理局域网 IP (排除 VPN / VMware 虚拟网卡)
    preferred_ip = '127.0.0.1'
    real_lans = [ip for ip in all_ips if not ip.startswith(('198.18.', '192.168.151.', '192.168.160.'))]
    if real_lans:
        preferred_ip = real_lans[0]
    elif all_ips:
        preferred_ip = all_ips[0]
    
    return preferred_ip, all_ips

def main():
    preferred_ip, all_ips = get_network_ips()
    mobile_url = f"http://{preferred_ip}:3000"

    print("=" * 66)
    print("   人体数字孪生（肺部）交互系统 - 手机端扫码访问")
    print("=" * 66)
    print(f" [OK] 检测到电脑端局域网推荐 IP: {preferred_ip}")
    if len(all_ips) > 1:
        print(f"      其他网卡 IP: {', '.join(all_ips)}")
    print(f" [URL] 手机端浏览器打开地址: {mobile_url}")
    print("=" * 66)
    print(" 手机与电脑连接同一 Wi-Fi 后，使用手机相机/微信扫一扫即可直接打开：")
    print("")

    try:
        import qrcode
        qr = qrcode.QRCode(border=2)
        qr.add_data(mobile_url)
        qr.print_ascii(invert=True)
    except Exception as e:
        print(f" [提示] 未安装 qrcode 库或终端不支持字符输出: {e}")
        print(f" 请直接在手机浏览器输入: {mobile_url}")
    
    print("")
    print("=" * 66)
    print(" 提示：如手机打不开，请检查电脑防火墙是否放行 3000 端口，并确认连接同一 Wi-Fi。")
    print("=" * 66)

if __name__ == '__main__':
    main()
