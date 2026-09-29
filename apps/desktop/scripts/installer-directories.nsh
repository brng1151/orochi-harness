!include "LogicLib.nsh"

Var ohFinalDirectory
Var ohNewDirectory
Var ohOldDirectory
Var ohOldMoved
Var ohNewMoved

!macro ohExtractPayload FILE
  !ifmacrodef customInstallerExtract
    !insertmacro customInstallerExtract "${FILE}"
  !else
    nsExec::ExecToStack '"$PLUGINSDIR\oh-7za.exe" x -y -bd -bb0 "-o$INSTDIR" "${FILE}"'
    Pop $R0
    Pop $R1
  !endif
  ${If} $R0 != 0
    DetailPrint $R1
    Call ohRollbackDirectories
    !ifmacrodef customInstallerExtractFailed
      !insertmacro customInstallerExtractFailed "${FILE}"
    !else
      MessageBox MB_OK|MB_ICONEXCLAMATION "$(decompressionFailed)" /SD IDOK
    !endif
    SetErrorLevel 2
    Quit
  ${EndIf}
!macroend

!macro ohStageApplication
  StrCpy $ohFinalDirectory $INSTDIR
  System::Call 'ole32::CoCreateGuid(g .r0) i .r1'
  ${If} $1 != 0
    SetErrorLevel 2
    Quit
  ${EndIf}
  StrCpy $ohNewDirectory "$INSTDIR.new-$0"
  StrCpy $ohOldDirectory "$INSTDIR.old-$0"
  StrCpy $ohOldMoved ""
  StrCpy $ohNewMoved ""
  ClearErrors
  CreateDirectory $ohNewDirectory
  ${If} ${Errors}
    SetErrorLevel 2
    Quit
  ${EndIf}
  File /oname=$PLUGINSDIR\oh-7za.exe "${OH_SEVENZIP_PATH}"
  StrCpy $INSTDIR $ohNewDirectory
  SetOutPath $INSTDIR
  !insertmacro installApplicationFiles
  !ifdef OH_SEVENZIP_LICENSE_DIR
    File /oname=7zip-installer-LICENSE.txt "${OH_SEVENZIP_LICENSE_DIR}\LICENSE.txt"
    File /oname=7zip-installer-COPYING.txt "${OH_SEVENZIP_LICENSE_DIR}\COPYING"
  !endif
  !ifdef UNINSTALLER_ICON
    File /oname=uninstallerIcon.ico "${UNINSTALLER_ICON}"
  !endif
  StrCpy $INSTDIR $ohFinalDirectory
  SetOutPath $PLUGINSDIR
!macroend

Function .onGUIEnd
  Call ohCleanupDirectories
FunctionEnd

Function ohCleanupDirectories
  ${If} $ohFinalDirectory != ""
    Call ohRollbackDirectories
  ${EndIf}
FunctionEnd

; Only directories created or renamed by this installer are removed during rollback.
Function ohRollbackDirectories
  SetOutPath $PLUGINSDIR
  ${If} $ohNewMoved == "1"
    RMDir /r "\\?\$ohFinalDirectory"
    StrCpy $ohNewMoved ""
  ${EndIf}
  ${If} $ohOldMoved == "1"
    ClearErrors
    Rename $ohOldDirectory $ohFinalDirectory
    ${If} ${Errors}
      ; Leave the complete backup in place if another process prevents restoration.
      DetailPrint $ohOldDirectory
      Return
    ${EndIf}
    StrCpy $ohOldMoved ""
  ${EndIf}
  ${If} $ohNewDirectory != ""
    RMDir /r "\\?\$ohNewDirectory"
  ${EndIf}
  StrCpy $INSTDIR $ohFinalDirectory
FunctionEnd

Function ohPromoteDirectories
  !ifmacrodef InstallerPublishStage
    !insertmacro InstallerPublishStage 2
  !endif
  ; SetOutPath opens a directory handle; release it before either rename.
  SetOutPath $PLUGINSDIR
  ClearErrors
  ${If} ${FileExists} "$ohFinalDirectory\*.*"
    Rename $ohFinalDirectory $ohOldDirectory
    ${If} ${Errors}
      Call ohRollbackDirectories
      SetErrors
      Return
    ${EndIf}
    StrCpy $ohOldMoved "1"
  ${Else}
    ; NSIS can create the destination before the install section starts.
    RMDir $ohFinalDirectory
  ${EndIf}
  ClearErrors
  Rename $ohNewDirectory $ohFinalDirectory
  ${If} ${Errors}
    Call ohRollbackDirectories
    SetErrors
    Return
  ${EndIf}
  StrCpy $ohNewMoved "1"
  SetOutPath $ohFinalDirectory
  !ifmacrodef InstallerPublishStage
    !insertmacro InstallerPublishStage 3
  !endif
  ClearErrors
FunctionEnd

!macro ohFinishDirectories
  StrCpy $ohNewMoved ""
  ${If} $ohOldMoved == "1"
    RMDir /r "\\?\$ohOldDirectory"
    StrCpy $ohOldMoved ""
  ${EndIf}
!macroend
