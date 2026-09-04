Set fso = CreateObject("Scripting.FileSystemObject")
currDir = fso.GetAbsolutePathName(".")
inFile = currDir & "\SIH2025-IDEA-Presentation-Format.pptx"
outFile = currDir & "\OceanEmbed_SIH_Final.pptx"

Set pptApp = CreateObject("PowerPoint.Application")
pptApp.Visible = True 
Set pres = pptApp.Presentations.Open(inFile)

' Delete Slide 7
pres.Slides(7).Delete

' --- SLIDE 1 ---
Set sld1 = pres.Slides(1)
For Each shp In sld1.Shapes
    If shp.Name = "TextBox 9" Then
        shp.TextFrame.TextRange.Text = "Problem Statement ID: SIH26066" & vbCrLf & _
            "Problem Statement Title: OceanEmbed - Satellite Embedding-Based Deep Learning Framework for Reconstruction of Subsurface Ocean Temperature from Surface Satellite Observations" & vbCrLf & _
            "Theme: Disaster Management" & vbCrLf & _
            "PS Category: Software" & vbCrLf & _
            "Team ID: [INSERT TEAM ID]" & vbCrLf & _
            "Team Name: [INSERT REGISTERED TEAM NAME]"
        shp.TextFrame.TextRange.Font.Size = 16
    End If
Next

' --- SLIDE 2 ---
Set sld2 = pres.Slides(2)
For Each shp In sld2.Shapes
    If shp.Name = "TextBox 8" Then
        shp.TextFrame.TextRange.Text = "OCEANEMBED SOLUTION PIPELINE:" & vbCrLf & vbCrLf & _
            "1. SURFACE OCEAN OBSERVATIONS (SST, SSS, SSH, Currents, Winds)" & vbCrLf & _
            "      ↓" & vbCrLf & _
            "2. OCEAN EMBEDDING ENGINE (Spatial Features & Temporal Context)" & vbCrLf & _
            "      ↓" & vbCrLf & _
            "3. SUBSURFACE TEMPERATURE (15 Depth Levels, 0m -> 1000m)" & vbCrLf & vbCrLf & _
            "CORE INNOVATIONS:" & vbCrLf & _
            "- SURFACE -> DEEP: Learn hidden subsurface structure from surface observations." & vbCrLf & _
            "- TEMPORAL INTELLIGENCE: Use multi-day surface observations to capture evolving ocean dynamics." & vbCrLf & _
            "- DEPTH-AWARE RECONSTRUCTION: Generate temperature estimates across 15 standard depth levels." & vbCrLf & vbCrLf & _
            "OceanEmbed combines: SPATIAL REPRESENTATION + TEMPORAL CONTEXT + DEPTH-AWARE DECODING + UNCERTAINTY + INDEPENDENT VALIDATION"
        shp.TextFrame.TextRange.Font.Size = 14
    End If
Next

' --- SLIDE 3 ---
Set sld3 = pres.Slides(3)
For Each shp In sld3.Shapes
    If shp.Name = "TextBox 8" Then
        shp.TextFrame.TextRange.Text = "TECHNICAL ARCHITECTURE:" & vbCrLf & vbCrLf & _
            "[ DATA INGESTION ] Satellite Observations (SST | SSS | SSH | Current U/V | Wind U/V)" & vbCrLf & _
            "        ↓ (surface fields)" & vbCrLf & _
            "[ DATA HARMONIZATION ] Quality Control | Coordinate Normalization | Regridding (0.25°) | Missing-Data Masks" & vbCrLf & _
            "        ↓ (regridded)" & vbCrLf & _
            "[ TEMPORAL CONTEXT ] D-6 -> D-5 -> D-4 -> D-3 -> D-2 -> D-1 -> D" & vbCrLf & _
            "        ↓ (temporal window)" & vbCrLf & _
            "[ OCEAN EMBEDDING ] Spatial Encoder (CNN) + Temporal Encoder (GRU) -> LATENT OCEAN EMBEDDING" & vbCrLf & _
            "        ↓ (latent features)" & vbCrLf & _
            "[ DEPTH-AWARE DECODER ] Depth Embeddings (0m to 1000m)" & vbCrLf & _
            "        ↓ (prediction)" & vbCrLf & _
            "[ SUBSURFACE OUTPUT ] Daily 0.25° x 0.25° temperature field (15 standard depths)" & vbCrLf & _
            "        ↓ (independent validation)" & vbCrLf & _
            "[ VALIDATION ] ARGO Validation & Depth-wise Uncertainty Estimation" & vbCrLf & vbCrLf & _
            "TECH STACK: Python, PyTorch, Xarray, FastAPI, React, Three.js"
        shp.TextFrame.TextRange.Font.Size = 12
    End If
Next

' --- SLIDE 4 ---
Set sld4 = pres.Slides(4)
For Each shp In sld4.Shapes
    If shp.Name = "TextBox 8" Then
        shp.TextFrame.TextRange.Text = "IMPLEMENTATION LADDER (FEASIBILITY):" & vbCrLf & _
            "Phase 1: Data Access -> Phase 2: QC + Harmonization -> Phase 3: Baseline Model -> Phase 4: Spatiotemporal Model -> Phase 5: Depth-Aware Reconstruction -> Phase 6: ARGO Validation -> Phase 7: Scale-Up" & vbCrLf & vbCrLf & _
            "RISK MATRIX & MITIGATIONS:" & vbCrLf & _
            "01. MISSING SATELLITE OBS: Clouds/gaps. MITIGATION: Quality masks + explicit missing-data handling." & vbCrLf & _
            "02. SPARSE VERTICAL OBS: ARGO is sparse. MITIGATION: GLORYS for training, gridded ARGO for independent validation." & vbCrLf & _
            "03. TEMPORAL OCEAN DYNAMICS: Evolving surface forcing. MITIGATION: Multi-day temporal context." & vbCrLf & _
            "04. MODEL UNCERTAINTY: Variable reliability. MITIGATION: Estimate uncertainty and expose with predictions." & vbCrLf & vbCrLf & _
            "SCALABILITY: POC (Bay of Bengal) -> VALIDATION -> SCALE (North Indian Ocean). Build small -> validate -> scale."
        shp.TextFrame.TextRange.Font.Size = 14
    End If
Next

' --- SLIDE 5 ---
Set sld5 = pres.Slides(5)
For Each shp In sld5.Shapes
    If shp.Name = "TextBox 8" Then
        shp.TextFrame.TextRange.Text = "IMPACT CHAIN:" & vbCrLf & _
            "SURFACE SATELLITE DATA -> OCEANEMBED -> SUBSURFACE TEMPERATURE FIELD -> 3D OCEAN UNDERSTANDING -> BETTER MONITORING" & vbCrLf & vbCrLf & _
            "- OCEAN RESEARCH: Better analysis of subsurface thermal structure." & vbCrLf & _
            "- FORECAST SUPPORT: Additional subsurface information." & vbCrLf & _
            "- MARITIME AWARENESS: Broader ocean understanding." & vbCrLf & vbCrLf & _
            "BENEFITS:" & vbCrLf & _
            "1. Ocean Intelligence: Transform surface observations into a richer representation of subsurface thermal structure." & vbCrLf & _
            "2. Scientific Research: Support analysis of surface-subsurface relationships at daily, gridded resolution." & vbCrLf & _
            "3. Scalable Framework: Designed as a reusable pipeline for regional expansion." & vbCrLf & vbCrLf & _
            "TARGET SPECIFICATION: 0.25° Grid | Daily Output | 15 Depth Levels | 5°N-30°N, 45°E-105°E"
        shp.TextFrame.TextRange.Font.Size = 14
    End If
Next

' --- SLIDE 6 ---
Set sld6 = pres.Slides(6)
For Each shp In sld6.Shapes
    If shp.Name = "TextBox 8" Then
        shp.TextFrame.TextRange.Text = "EVIDENCE ECOSYSTEM:" & vbCrLf & vbCrLf & _
            "DATA SOURCES:" & vbCrLf & _
            "- Satellite ocean surface observations (CMEMS)" & vbCrLf & _
            "- GLORYS Global Ocean Reanalysis" & vbCrLf & _
            "- Gridded ARGO / INCOIS LAS Gridded ARGO" & vbCrLf & vbCrLf & _
            "METHODS:" & vbCrLf & _
            "- Spatiotemporal deep learning" & vbCrLf & _
            "- Representation learning" & vbCrLf & _
            "- Ocean subsurface reconstruction" & vbCrLf & _
            "- Uncertainty estimation & Independent validation" & vbCrLf & vbCrLf & _
            "TECHNOLOGY FOUNDATION:" & vbCrLf & _
            "- PyTorch, Xarray, Python scientific stack" & vbCrLf & _
            "- FastAPI, React, Three.js"
        shp.TextFrame.TextRange.Font.Size = 14
    End If
Next

pres.SaveAs outFile
pres.Close
pptApp.Quit

WScript.Echo "PPT Generation Complete!"
