# language: YAML, file: .github/workflows/ci.yml, target: GitHub Actions
name: NexaBuild Universal CI

on:
  workflow_dispatch:
    inputs:
      target_lang:
        description: 'Target arsitektur build'
        required: true
        default: 'all'
        type: choice
        options:
          - all
          - nodejs
          - android
          - python
          - go
          - rust
          - cpp
      extra_args:
        description: 'Argumen kompilator tambahan (opsional)'
        required: false
        type: string

permissions:
  contents: write
  actions: write

env:
  # Bypass 422 Parser Error: Menggunakan path dinamis yang didukung di level global
  NEXA_WORKSPACE: ${{ github.workspace }}

jobs:
  validate:
    name: 🛡️ Pre-flight Validation
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
      
      - name: Setup Environment
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          
      - name: Install Validators
        run: |
          pip install yamllint
          npm install -g eslint
          
      - name: NexaBuild Core Validation
        run: |
          if [ -f tools/validate_project.py ]; then
            python tools/validate_project.py
          else
            echo "Notice: Script validasi lokal tidak ditemukan, melanjutkan eksekusi."
          fi

  build:
    name: 🚀 Core Build Engine
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js (Web/JS)
        if: inputs.target_lang == 'nodejs' || inputs.target_lang == 'all'
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Compile Node.js
        if: inputs.target_lang == 'nodejs' || inputs.target_lang == 'all'
        run: |
          if [ -f package.json ]; then 
            npm install && npm run build ${{ inputs.extra_args }}
          fi

      - name: Setup Java (Android)
        if: inputs.target_lang == 'android' || inputs.target_lang == 'all'
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'
          cache: 'gradle'
      - name: Compile Android APK
        if: inputs.target_lang == 'android' || inputs.target_lang == 'all'
        run: |
          if [ -f gradlew ]; then
            chmod +x gradlew
            ./gradlew assembleRelease ${{ inputs.extra_args }}
          fi

      - name: Setup Python
        if: inputs.target_lang == 'python' || inputs.target_lang == 'all'
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'
      - name: Compile Python
        if: inputs.target_lang == 'python' || inputs.target_lang == 'all'
        run: |
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          if [ -f setup.py ]; then python setup.py build ${{ inputs.extra_args }}; fi

      - name: Setup Go
        if: inputs.target_lang == 'go' || inputs.target_lang == 'all'
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache: 'go-build'
      - name: Compile Go
        if: inputs.target_lang == 'go' || inputs.target_lang == 'all'
        run: |
          if [ -f go.mod ]; then go build -v ${{ inputs.extra_args }} ./...; fi

      - name: Setup Rust
        if: inputs.target_lang == 'rust' || inputs.target_lang == 'all'
        uses: dtolnay/rust-toolchain@stable
      - name: Compile Rust
        if: inputs.target_lang == 'rust' || inputs.target_lang == 'all'
        run: |
          if [ -f Cargo.toml ]; then cargo build --release ${{ inputs.extra_args }}; fi

      - name: Compile C/C++
        if: inputs.target_lang == 'cpp' || inputs.target_lang == 'all'
        run: |
          if [ -f Makefile ]; then 
            make ${{ inputs.extra_args }}
          elif [ -f CMakeLists.txt ]; then 
            mkdir -p build && cd build && cmake .. && make ${{ inputs.extra_args }}
          fi

      - name: 📦 Publish Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: nexabuild-outputs-${{ github.run_id }}
          path: |
            dist/
            build/
            target/release/
            app/build/outputs/apk/**/*.apk
            *.exe
            *.bin
            *.apk
          retention-days: 7
