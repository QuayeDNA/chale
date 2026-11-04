param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\assets\images')
)

Add-Type -AssemblyName System.Drawing

$size = 1024
$outputDirectory = [System.IO.Path]::GetFullPath($OutputDirectory)
[System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null

function New-Background {
  param(
    [string]$Path,
    [string]$InnerColor,
    [string]$OuterColor,
    [string]$DotColor,
    [string]$AccentColor,
    [int]$DotAlpha,
    [int]$SpeckAlpha,
    [int]$AccentAlpha
  )

  $bitmap = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

  $rect = [System.Drawing.Rectangle]::new(0, 0, $size, $size)
  $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml($OuterColor))
  $gradient = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $rect,
    [System.Drawing.ColorTranslator]::FromHtml($InnerColor),
    [System.Drawing.ColorTranslator]::FromHtml($OuterColor),
    55.0
  )
  $graphics.FillRectangle($gradient, $rect)
  $gradient.Dispose()

  $random = [System.Random]::new(7319)
  $dotBase = [System.Drawing.ColorTranslator]::FromHtml($DotColor)

  for ($x = 24; $x -lt $size; $x += 32) {
    for ($y = 24; $y -lt $size; $y += 32) {
      $jx = $x + $random.Next(-7, 8)
      $jy = $y + $random.Next(-7, 8)
      $radius = 0.8 + ($random.NextDouble() * 1.9)
      $alpha = [Math]::Max(4, $DotAlpha + $random.Next(-8, 9))
      $brush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb($alpha, $dotBase.R, $dotBase.G, $dotBase.B))
      $graphics.FillEllipse($brush, $jx, $jy, $radius * 2, $radius * 2)
      $brush.Dispose()
    }
  }

  for ($i = 0; $i -lt 2600; $i++) {
    $px = $random.NextDouble() * $size
    $py = $random.NextDouble() * $size
    $radius = 0.35 + ($random.NextDouble() * 1.2)
    $alpha = $SpeckAlpha + $random.Next(-6, 7)
    if ($alpha -lt 1) { $alpha = 1 }
    $brush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb($alpha, $dotBase.R, $dotBase.G, $dotBase.B))
    $graphics.FillEllipse($brush, $px, $py, $radius * 2, $radius * 2)
    $brush.Dispose()
  }

  $accent = [System.Drawing.ColorTranslator]::FromHtml($AccentColor)

  $points = @(
    @(148, 226), @(872, 250), @(186, 828), @(844, 792),
    @(300, 154), @(735, 142), @(284, 895), @(760, 888)
  )

  foreach ($point in $points) {
    $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb($AccentAlpha, $accent.R, $accent.G, $accent.B), 3.0)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $graphics.DrawLine($pen, $point[0] - 8, $point[1], $point[0] + 8, $point[1])
    $graphics.DrawLine($pen, $point[0], $point[1] - 8, $point[0], $point[1] + 8)
    $pen.Dispose()
  }

  $graphics.Dispose()
  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

New-Background `
  -Path (Join-Path $outputDirectory 'android-icon-background.png') `
  -InnerColor '#3A2412' `
  -OuterColor '#231408' `
  -DotColor '#F5B400' `
  -AccentColor '#F5B400' `
  -DotAlpha 16 `
  -SpeckAlpha 8 `
  -AccentAlpha 22

New-Background `
  -Path (Join-Path $outputDirectory 'android-icon-background-light.png') `
  -InnerColor '#FBF3DF' `
  -OuterColor '#F2E2C2' `
  -DotColor '#C9A66B' `
  -AccentColor '#F5B400' `
  -DotAlpha 22 `
  -SpeckAlpha 10 `
  -AccentAlpha 36
