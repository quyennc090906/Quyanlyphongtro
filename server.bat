@echo off
chcp 65001 > nul
title Máy chủ Web Quản Lý Phòng Trọ (Hỗ trợ mở trên Điện thoại)
echo ======================================================================
echo    MÁY CHỦ WEB NỘI BỘ QUẢN LÝ PHÒNG TRỌ
echo ======================================================================
echo.
echo Đang khởi chạy web server tại cổng 8080...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$port = 8080; ^
   $listener = New-Object System.Net.HttpListener; ^
   $listener.Prefixes.Add(\"http://localhost:$port/\"); ^
   $listener.Prefixes.Add(\"http://+:$port/\"); ^
   try { $listener.Start() } catch { ^
     $listener = New-Object System.Net.HttpListener; ^
     $listener.Prefixes.Add(\"http://localhost:$port/\"); ^
     $listener.Start() ^
   }; ^
   Write-Host \"[+] Web server đang chạy tại: http://localhost:$port/\" -ForegroundColor Green; ^
   $ips = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike '*Loopback*' -and $_.IPAddress -notlike '169.254*' }).IPAddress; ^
   foreach ($ip in $ips) { Write-Host \"[+] Mở trên điện thoại qua Wi-Fi: http://$($ip):$port/\" -ForegroundColor Cyan }; ^
   Start-Process \"http://localhost:$port/\"; ^
   while ($listener.IsListening) { ^
     $context = $listener.GetContext(); ^
     $request = $context.Request; ^
     $response = $context.Response; ^
     $path = $request.Url.LocalPath.TrimStart('/'); ^
     if ([string]::IsNullOrEmpty($path)) { $path = 'index.html' }; ^
     $fullPath = Join-Path $PSScriptRoot $path; ^
     if (Test-Path $fullPath -PathType Leaf) { ^
       $bytes = [System.IO.File]::ReadAllBytes($fullPath); ^
       $ext = [System.IO.Path]::GetExtension($fullPath).ToLower(); ^
       $contentType = switch ($ext) { ^
         '.html' { 'text/html; charset=utf-8' } ^
         '.js'   { 'application/javascript; charset=utf-8' } ^
         '.css'  { 'text/css; charset=utf-8' } ^
         '.json' { 'application/json; charset=utf-8' } ^
         default { 'application/octet-stream' } ^
       }; ^
       $response.ContentType = $contentType; ^
       $response.ContentLength64 = $bytes.Length; ^
       $response.OutputStream.Write($bytes, 0, $bytes.Length); ^
     } else { ^
       $response.StatusCode = 404; ^
     }; ^
     $response.Close(); ^
   }"
pause
