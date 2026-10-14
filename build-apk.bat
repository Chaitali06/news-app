@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo       CHRONICLE NEWS - ANDROID APK BUILDER
echo ========================================================
echo.

echo [1/4] Building React Web Assets...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Web build failed!
    pause
    exit /b %errorlevel%
)
echo [OK] Web build completed successfully.
echo.

echo [2/4] Syncing Capacitor Android Project...
call npx cap sync android
if %errorlevel% neq 0 (
    echo [ERROR] Capacitor sync failed!
    pause
    exit /b %errorlevel%
)
echo [OK] Capacitor sync completed.
echo.

echo [3/4] Verifying Java / Gradle environment...
if exist "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot\bin\java.exe" set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"

if exist "%LOCALAPPDATA%\Android\Sdk" set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
if defined ANDROID_HOME set "PATH=%ANDROID_HOME%\platform-tools;%PATH%"

where java >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Java JDK 17 is not detected in your PATH.
    pause
    exit /b 1
)

echo [OK] Java detected.
where java
echo.

if not defined ANDROID_HOME (
    echo [ERROR] Android SDK was not detected at %LOCALAPPDATA%\Android\Sdk
    pause
    exit /b 1
)

echo [OK] Android SDK detected at %ANDROID_HOME%
if not exist "android\local.properties" (
    echo sdk.dir=C\:\\Users\\%USERNAME%\\AppData\\Local\\Android\\Sdk> "android\local.properties"
)

echo.
echo Preparing release signing keystore...
if not exist "android\app\release.keystore" (
    echo Generating release signing keystore...
    keytool -genkeypair -v -keystore android\app\release.keystore -alias chronicle -keyalg RSA -keysize 2048 -validity 10000 -storepass chronicle123 -keypass chronicle123 -dname "CN=Chronicle News, O=Chronicle Media, C=US" >nul 2>nul
)

echo Compiling Android Signed Release APK with Gradle...
cd android
call gradlew.bat assembleRelease
set GRADLE_STATUS=%errorlevel%
cd ..

if %GRADLE_STATUS% neq 0 (
    echo [ERROR] Gradle compilation failed.
    pause
    exit /b %GRADLE_STATUS%
)

echo.
echo [4/4] Deploying compiled APK for browser download...
if exist "android\app\build\outputs\apk\release\app-release.apk" (
    copy /y "android\app\build\outputs\apk\release\app-release.apk" "public\chronicle-news.apk" >nul
    copy /y "android\app\build\outputs\apk\release\app-release.apk" "dist\chronicle-news.apk" >nul
    copy /y "android\app\build\outputs\apk\release\app-release.apk" "chronicle-news.apk" >nul
    echo [SUCCESS] Signed Release APK compiled and deployed successfully!
    echo Users can now install Chronicle News without 3rd-party sandbox/coc-box errors.
) else (
    echo [WARNING] Release APK file not found at expected build path.
)

echo.
echo ========================================================
echo       BUILD PROCESS COMPLETE
echo ========================================================
pause
