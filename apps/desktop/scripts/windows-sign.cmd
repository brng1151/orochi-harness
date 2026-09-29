@echo off
setlocal DisableDelayedExpansion
set "signTool=%OH_DESKTOP_WINDOWS_SIGNTOOL%"
set "certificateFile=%OH_DESKTOP_WINDOWS_CER_FILE%"
set "tokenPin=%OH_DESKTOP_WINDOWS_TOKEN_PIN%"
set "keyContainer=%OH_DESKTOP_WINDOWS_KEY_CONTAINER%"
set "targetFile=%OH_DESKTOP_WINDOWS_SIGN_TARGET%"
set "appendSignature="
if "%OH_DESKTOP_WINDOWS_SIGN_APPEND%"=="1" set "appendSignature=/as"
set "OH_DESKTOP_WINDOWS_SIGNTOOL="
set "OH_DESKTOP_WINDOWS_CER_FILE="
set "OH_DESKTOP_WINDOWS_TOKEN_PIN="
set "OH_DESKTOP_WINDOWS_KEY_CONTAINER="
set "OH_DESKTOP_WINDOWS_SIGN_TARGET="
set "OH_DESKTOP_WINDOWS_SIGN_APPEND="
set "signTool=" & set "certificateFile=" & set "tokenPin=" & set "keyContainer=" & set "targetFile=" & set "appendSignature=" & "%signTool%" sign /v /fd sha256 /f "%certificateFile%" /kc "[{{%tokenPin%}}]=%keyContainer%" /csp "eToken Base Cryptographic Provider" %appendSignature% "%targetFile%"
exit /b %errorlevel%
