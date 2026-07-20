{
  description = "brids reproducible development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
      in {
        devShells.default = pkgs.mkShell {
          name = "brids-devshell";

          packages = with pkgs; [
            bashInteractive
            coreutils
            git
            gnumake
            jq
            nodejs_22
            openssl
            postgresql
            pkg-config
            python3
            rustup
            solana-cli
            unzip
            yarn
          ];

          shellHook = ''
            export PLAYWRIGHT_BROWSERS_PATH="${pkgs.playwright-driver.browsers}"
            export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

            if [ ! -d ".git" ]; then
              echo "[nix] Warning: devShell started outside repo root"
            fi

            echo "[nix] devShell ready"
            echo "[nix] Node: $(node --version)"
            echo "[nix] pnpm: $(pnpm --version)"
            echo "[nix] Solana: $(solana --version)"
            echo "[nix] Rustup: $(rustup --version | head -n 1)"
            echo "[nix] Run: pnpm install && pnpm validate"
          '';
        };
      });
}
