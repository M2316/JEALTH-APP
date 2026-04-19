Add-Type -AssemblyName System.Drawing

$src = "C:\Users\JADEN\Desktop\code\jealth\jealth-app\assets\images\jealth-logo-rm-bg.png"
$out = "C:\Users\JADEN\Desktop\code\jealth\jealth-app\assets\images"

$srcFull = [System.Drawing.Image]::FromFile($src)
# Crop center square since source is wide (2752x1536) with logo centered
$cropSize = [Math]::Min($srcFull.Width, $srcFull.Height)
$cropX = [int](($srcFull.Width - $cropSize) / 2)
$cropY = [int](($srcFull.Height - $cropSize) / 2)
$source = New-Object System.Drawing.Bitmap($cropSize, $cropSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$cropG = [System.Drawing.Graphics]::FromImage($source)
$cropG.DrawImage($srcFull, (New-Object System.Drawing.Rectangle(0,0,$cropSize,$cropSize)), $cropX, $cropY, $cropSize, $cropSize, [System.Drawing.GraphicsUnit]::Pixel)
$cropG.Dispose()
$srcFull.Dispose()

function New-Square {
    param([int]$size, [string]$bgHex, [double]$logoScale, [string]$path, [bool]$whiteTint = $false)
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

    if ($bgHex -eq "transparent") {
        $g.Clear([System.Drawing.Color]::Transparent)
    } else {
        $r = [Convert]::ToInt32($bgHex.Substring(1,2), 16)
        $gr = [Convert]::ToInt32($bgHex.Substring(3,2), 16)
        $b = [Convert]::ToInt32($bgHex.Substring(5,2), 16)
        $g.Clear([System.Drawing.Color]::FromArgb(255, $r, $gr, $b))
    }

    # Source aspect is 2752x1536 — fit inside square with scale factor
    $srcAspect = $source.Width / $source.Height
    $targetLong = [int]($size * $logoScale)
    if ($srcAspect -ge 1) {
        $drawW = $targetLong
        $drawH = [int]($targetLong / $srcAspect)
    } else {
        $drawH = $targetLong
        $drawW = [int]($targetLong * $srcAspect)
    }
    $x = [int](($size - $drawW) / 2)
    $y = [int](($size - $drawH) / 2)

    if ($whiteTint) {
        # Draw source then overlay white via color matrix
        $cm = New-Object System.Drawing.Imaging.ColorMatrix
        $cm.Matrix00 = 0; $cm.Matrix11 = 0; $cm.Matrix22 = 0
        $cm.Matrix40 = 1; $cm.Matrix41 = 1; $cm.Matrix42 = 1
        $ia = New-Object System.Drawing.Imaging.ImageAttributes
        $ia.SetColorMatrix($cm)
        $rect = New-Object System.Drawing.Rectangle($x, $y, $drawW, $drawH)
        $g.DrawImage($source, $rect, 0, 0, $source.Width, $source.Height, [System.Drawing.GraphicsUnit]::Pixel, $ia)
    } else {
        $g.DrawImage($source, $x, $y, $drawW, $drawH)
    }

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    Write-Host "wrote $path ($size x $size)"
}

# Main app icon — black bg
New-Square -size 1024 -bgHex "#000000" -logoScale 0.92 -path "$out\icon.png"

# Favicon — smaller
New-Square -size 512 -bgHex "#000000" -logoScale 0.92 -path "$out\favicon.png"

# Splash — logo on transparent, renderer fills backgroundColor
New-Square -size 1024 -bgHex "transparent" -logoScale 0.55 -path "$out\splash-icon.png"

# Android adaptive foreground — leave safe zone (logo inside inner 66%)
New-Square -size 1024 -bgHex "transparent" -logoScale 0.62 -path "$out\android-icon-foreground.png"

# Android adaptive background — solid black
$bgBmp = New-Object System.Drawing.Bitmap(1024, 1024)
$bgG = [System.Drawing.Graphics]::FromImage($bgBmp)
$bgG.Clear([System.Drawing.Color]::Black)
$bgBmp.Save("$out\android-icon-background.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bgG.Dispose(); $bgBmp.Dispose()
Write-Host "wrote $out\android-icon-background.png"

# Monochrome — white tinted silhouette
New-Square -size 1024 -bgHex "transparent" -logoScale 0.62 -path "$out\android-icon-monochrome.png" -whiteTint $true

$source.Dispose()
Write-Host "done."
