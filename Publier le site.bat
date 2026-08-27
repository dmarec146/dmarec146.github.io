@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Publier le site

echo Recherche des modifications...
git add -A

git diff --cached --quiet
if %errorlevel%==0 (
    echo.
    echo Aucun changement a publier.
    echo.
    pause
    exit /b
)

echo.
echo Modifications detectees :
git status --short --cached
echo.

set "msg="
set /p msg="Description du changement (laisser vide pour un message par defaut) : "
if "%msg%"=="" set "msg=Mise a jour du site"

git commit -m "%msg%"
if errorlevel 1 (
    echo.
    echo Erreur lors du commit.
    pause
    exit /b
)

echo.
echo Envoi vers GitHub...
git push
if errorlevel 1 (
    echo.
    echo Erreur lors de l'envoi. Verifie ta connexion internet.
    pause
    exit /b
)

echo.
echo ============================================
echo  Site mis a jour ! Visible en ligne dans 1-2 minutes.
echo  https://dmarec146.github.io/
echo ============================================
echo.
pause
