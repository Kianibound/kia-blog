param([string]$RepositoryName = 'Kianibound/kia-blog')

$ErrorActionPreference = 'Stop'
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw 'GitHub CLI (gh) is required. Install it and authenticate before running this script.'
}
gh auth status
if ($LASTEXITCODE -ne 0) { throw 'GitHub CLI authentication is unavailable.' }

$existingLabels = @(gh api "repos/$RepositoryName/labels" --paginate --jq '.[].name')
if ($LASTEXITCODE -ne 0) { throw 'Could not read repository labels.' }

$labelSpecs = @(
    @{ Name = 'needs-triage'; Color = 'FBCA04'; Description = 'Maintainer evaluation needed' },
    @{ Name = 'needs-info'; Color = 'D876E3'; Description = 'Waiting for more information' },
    @{ Name = 'ready-for-agent'; Color = '0E8A16'; Description = 'Specified work suitable for an agent' },
    @{ Name = 'ready-for-human'; Color = '1D76DB'; Description = 'Human implementation required' },
    @{ Name = 'wontfix'; Color = 'FFFFFF'; Description = 'Will not be actioned' }
)

foreach ($labelSpec in $labelSpecs) {
    if ($existingLabels -ccontains $labelSpec.Name) {
        Write-Output "Preserved $($labelSpec.Name)"
        continue
    }
    gh label create $labelSpec.Name --repo $RepositoryName --color $labelSpec.Color --description $labelSpec.Description
    if ($LASTEXITCODE -ne 0) { throw "Could not create $($labelSpec.Name)." }
}

$verifiedLabels = @(gh api "repos/$RepositoryName/labels" --paginate --jq '.[].name')
if ($LASTEXITCODE -ne 0) { throw 'Could not verify repository labels.' }
foreach ($labelSpec in $labelSpecs) {
    if ($verifiedLabels -cnotcontains $labelSpec.Name) { throw "Missing label: $($labelSpec.Name)" }
}
Write-Output 'Verified all five default triage labels. No issues were created.'
