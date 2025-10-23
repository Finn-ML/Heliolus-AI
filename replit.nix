{ pkgs }: {
  deps = [
    pkgs.chromium
    pkgs.nss
    pkgs.freetype
    pkgs.freetype.dev
    pkgs.fontconfig
    pkgs.stdenv.cc.cc.lib
  ];
}
