Set fso = CreateObject("Scripting.FileSystemObject")
Set outFile = fso.CreateTextFile("ppt_dump.txt", True)

Set pptApp = CreateObject("PowerPoint.Application")
' Do not make visible to prevent popups grabbing focus
pptApp.Visible = True 
Set pres = pptApp.Presentations.Open("D:\Ocean_embeded\SIH2025-IDEA-Presentation-Format.pptx")

For Each sld In pres.Slides
    outFile.WriteLine "--- Slide " & sld.SlideIndex & " ---"
    For Each shp In sld.Shapes
        If shp.HasTextFrame Then
            If shp.TextFrame.HasText Then
                outFile.WriteLine "Shape '" & shp.Name & "': " & Replace(shp.TextFrame.TextRange.Text, vbCr, " ")
            End If
        End If
    Next
Next

pres.Close
pptApp.Quit
outFile.Close
WScript.Echo "Dump Complete"
