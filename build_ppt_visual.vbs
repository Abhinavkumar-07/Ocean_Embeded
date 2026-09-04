Set fso = CreateObject("Scripting.FileSystemObject")
currDir = fso.GetAbsolutePathName(".")
inFile = currDir & "\SIH2025-IDEA-Presentation-Format.pptx"
outFile = currDir & "\OceanEmbed_SIH_Visual.pptx"

Set pptApp = CreateObject("PowerPoint.Application")
pptApp.Visible = True 
Set pres = pptApp.Presentations.Open(inFile)

Const msoShapeRectangle = 1
Const msoShapeDownArrow = 35
Const msoShapeRightArrow = 33
Const msoShapeRoundedRectangle = 5

Function AddBox(sld, text, x, y, w, h, r, g, b)
    Set shp = sld.Shapes.AddShape(msoShapeRoundedRectangle, x, y, w, h)
    shp.Fill.ForeColor.RGB = RGB(r, g, b)
    shp.Line.Visible = False
    shp.TextFrame.TextRange.Text = text
    shp.TextFrame.TextRange.Font.Name = "Arial"
    shp.TextFrame.TextRange.Font.Size = 12
    shp.TextFrame.TextRange.Font.Color.RGB = RGB(255, 255, 255)
    shp.TextFrame.TextRange.Font.Bold = True
    Set AddBox = shp
End Function

Function AddArrow(sld, x, y, w, h)
    Set shp = sld.Shapes.AddShape(msoShapeDownArrow, x, y, w, h)
    shp.Fill.ForeColor.RGB = RGB(150, 150, 150)
    shp.Line.Visible = False
End Function

' ---------------- SLIDE 2: IDEA TITLE ----------------
Set sld2 = pres.Slides(2)
' Delete the generic text box
For Each shp In sld2.Shapes
    If shp.Name = "TextBox 8" Then shp.Delete
Next
AddBox sld2, "SURFACE OCEAN OBSERVATIONS (SST | SSS | SSH | Current | Wind)", 100, 120, 760, 60, 59, 130, 246
AddArrow sld2, 470, 185, 20, 30
AddBox sld2, "OCEAN EMBEDDING ENGINE (Spatial Features | Temporal Context | Latent Space)", 100, 220, 760, 60, 139, 92, 246
AddArrow sld2, 470, 285, 20, 30
AddBox sld2, "SUBSURFACE TEMPERATURE (15 DEPTH LEVELS | 0m -> 1000m)", 100, 320, 760, 60, 16, 185, 129
AddBox sld2, "OceanEmbed combines: SPATIAL REPRESENTATION + TEMPORAL CONTEXT + DEPTH-AWARE DECODING", 100, 420, 760, 40, 4, 8, 15

' ---------------- SLIDE 3: TECHNICAL APPROACH ----------------
Set sld3 = pres.Slides(3)
For Each shp In sld3.Shapes
    If shp.Name = "TextBox 8" Then shp.Delete
Next
AddBox sld3, "DATA INGESTION LAYER" & vbCrLf & "Satellite Observations (SST | SSS | SSH/SLA | Current U/V | Wind U/V)", 100, 100, 760, 45, 59, 130, 246
AddArrow sld3, 470, 148, 20, 20
AddBox sld3, "DATA HARMONIZATION ENGINE" & vbCrLf & "QC | Coordinate Normalization | Regridding (0.25°) | Missing-Data Masks", 100, 170, 760, 45, 59, 130, 246
AddArrow sld3, 470, 218, 20, 20
AddBox sld3, "TEMPORAL CONTEXT ENGINE" & vbCrLf & "D-6 -> D-5 -> D-4 -> D-3 -> D-2 -> D-1 -> D", 100, 240, 760, 45, 139, 92, 246
AddArrow sld3, 470, 288, 20, 20
AddBox sld3, "OCEAN EMBEDDING ENGINE" & vbCrLf & "Spatial Encoder (CNN) -> Temporal Encoder (GRU) -> LATENT EMBEDDING", 100, 310, 760, 45, 139, 92, 246
AddArrow sld3, 470, 358, 20, 20
AddBox sld3, "DEPTH-AWARE DECODER" & vbCrLf & "Depth Embeddings (0, 5, 10, 20, 50, 100, 200, 500, 1000m)", 100, 380, 760, 45, 249, 115, 22
AddArrow sld3, 470, 428, 20, 20
AddBox sld3, "SUBSURFACE OUTPUT & VALIDATION" & vbCrLf & "Daily 0.25° Temp Field | Independent ARGO Validation", 100, 450, 760, 45, 16, 185, 129

' ---------------- SLIDE 6: RESEARCH ----------------
Set sld6 = pres.Slides(6)
For Each shp In sld6.Shapes
    If shp.Name = "TextBox 8" Then shp.Delete
Next
AddBox sld6, "SATELLITE OBSERVATIONS", 100, 150, 240, 80, 59, 130, 246
AddBox sld6, "GLORYS REANALYSIS", 360, 150, 240, 80, 4, 8, 15
AddBox sld6, "ARGO VALIDATION", 620, 150, 240, 80, 16, 185, 129

AddBox sld6, "DEEP LEARNING RECONSTRUCTION", 360, 280, 240, 60, 139, 92, 246
AddBox sld6, "SUBSURFACE TEMPERATURE FIELD", 360, 390, 240, 60, 16, 185, 129


pres.SaveAs outFile
pres.Close
pptApp.Quit

WScript.Echo "Visual PPT Generation Complete!"
