# Windows 環境のセットアップ

本プロジェクトは POSIX 環境（Linux / macOS）を推奨しています。Windows では以下のいずれかの方法でセットアップしてください。

## 方法 1: WSL2（推奨）

WSL2 + Ubuntu を使用する方法です。Docker Desktop との連携も容易で、最も安定した開発体験が得られます。

### 1. WSL2 と Ubuntu をインストール

```powershell
wsl --install -d Ubuntu-24.04 --name Ubuntu
# 再起動後
wsl --update
```

### 2. Ubuntu 内で開発ツールをインストール

1. システムの更新

```bash
sudo apt update && sudo apt full-upgrade -y
```

2. **[NVMインストールガイド](https://www.nvmnode.com/ja/guide/installation-sh.html)**

```bash
# nvm環境変数が設定できたら
nvm install lts/* && nvm use lts/* && nvm alias default lts/*
```

3.  **[Goのインストール](https://go.dev/doc/install)**
4.  **[windowにDockerをインストール](https://www.docker.com/)**

### 3. リポジトリをクローンしてセットアップ

```bash
git clone https://github.com/TeamH04/team-production.git
cd team-production
make install
```

### 4. 開発サーバーを起動

```bash
# データベースマイグレーション
make db-migrate

# 開発サーバー起動
make dev
```

## 方法 2: MSYS2 UCRT64

ネイティブ Windows 環境で開発したい場合は MSYS2 UCRT64 を使用します。

### 1. MSYS2 をインストール

[MSYS2 公式サイト](https://www.msys2.org/) からインストーラをダウンロードして実行します。

### 2. UCRT64 ターミナルで必要なパッケージをインストールして環境変数を設定

```bash
pacman -Syu
# ターミナル再起動後にもう一度
pacman -Syu
pacman -S mingw-w64-ucrt-x86_64-toolchain make
```

`C:\msys64\ucrt64\bin\`をシステム環境変数PATHに追加

```powershell
# 管理者権限でPowerShellを実行
$path = [Environment]::GetEnvironmentVariable("Path", "Machine")

if ($path -notlike "*C:\msys64\ucrt64\bin*") {
    [Environment]::SetEnvironmentVariable(
        "Path",
        "$path;C:\msys64\ucrt64\bin",
        "Machine"
    )
}
```

```powershell
# 新しいターミナルを開いて確認
make -v
```

### 3. NVM と Go をインストール

https://www.nvmnode.com/ja/guide/download.html

https://go.dev/doc/install

```powershell
# nvm環境変数が設定できたら
nvm install lts/* && nvm use lts/* && nvm alias default lts/*
```

### 4. リポジトリをクローンしてセットアップ

```bash
git clone https://github.com/TeamH04/team-production.git
cd team-production
make install
```

### 5. 開発サーバーを起動

```bash
# データベースマイグレーション
make db-migrate

# 開発サーバー起動
make dev
```
