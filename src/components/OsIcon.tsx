import type { SimpleIcon } from "simple-icons";
import {
  siApple,
  siLinux,
  siUbuntu,
  siDebian,
  siCentos,
  siFedora,
  siArchlinux,
  siRedhat,
  siOpensuse,
  siSuse,
  siAlpinelinux,
  siGentoo,
  siManjaro,
  siLinuxmint,
  siKalilinux,
  siRockylinux,
  siAlmalinux,
  siNixos,
  siArtixlinux,
  siGarudalinux,
  siAsahilinux,
  siKubuntu,
  siLubuntu,
  siUbuntumate,
  siXubuntu,
  siMxlinux,
  siNobaralinux,
  siVoidlinux,
  siOpenwrt,
} from "simple-icons";
import { Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const OS_SIMPLE_ICON_MATCHERS: Array<{ keywords: string[]; icon: SimpleIcon }> =
  [
    // macOS / Darwin
    { keywords: ["macos", "mac os", "darwin", "osx"], icon: siApple },
    // Ubuntu 家族
    { keywords: ["kubuntu"], icon: siKubuntu },
    { keywords: ["lubuntu"], icon: siLubuntu },
    { keywords: ["xubuntu"], icon: siXubuntu },
    { keywords: ["ubuntu mate"], icon: siUbuntumate },
    { keywords: ["ubuntu"], icon: siUbuntu },
    // Debian
    { keywords: ["debian"], icon: siDebian },
    // Red Hat 系
    { keywords: ["centos"], icon: siCentos },
    { keywords: ["fedora"], icon: siFedora },
    { keywords: ["red hat", "redhat", "rhel"], icon: siRedhat },
    { keywords: ["rocky"], icon: siRockylinux },
    { keywords: ["alma"], icon: siAlmalinux },
    // SUSE 系
    { keywords: ["opensuse"], icon: siOpensuse },
    { keywords: ["suse"], icon: siSuse },
    // Arch 系
    { keywords: ["artix"], icon: siArtixlinux },
    { keywords: ["garuda"], icon: siGarudalinux },
    { keywords: ["manjaro"], icon: siManjaro },
    { keywords: ["arch"], icon: siArchlinux },
    // OpenWrt
    { keywords: ["openwrt", "open-wrt"], icon: siOpenwrt }, // 添加 OpenWrt 匹配

    // 其他发行版
    { keywords: ["alpine"], icon: siAlpinelinux },
    { keywords: ["asahi"], icon: siAsahilinux },
    { keywords: ["gentoo"], icon: siGentoo },
    { keywords: ["kali"], icon: siKalilinux },
    { keywords: ["mint"], icon: siLinuxmint },
    { keywords: ["mx linux", "mxlinux"], icon: siMxlinux },
    { keywords: ["nobara"], icon: siNobaralinux },
    { keywords: ["nixos", "nix os"], icon: siNixos },
    { keywords: ["void"], icon: siVoidlinux },
    // 通用 Linux
    { keywords: ["linux"], icon: siLinux },
  ];

function matchSimpleIcon(os: string | null): SimpleIcon | null {
  if (!os) return null;
  const lower = os.toLowerCase();
  for (const { keywords, icon } of OS_SIMPLE_ICON_MATCHERS) {
    if (keywords.some((kw) => lower.includes(kw))) return icon;
  }
  return null;
}

interface OsIconProps {
  os: string | null;
  className?: string;
}

export function OsIcon({ os, className }: OsIconProps) {
  const icon = matchSimpleIcon(os);
  const lower = os?.toLowerCase() ?? "";

  if (!icon && lower.includes("windows")) {
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("h-4 w-4 fill-current", className)}
        aria-label="Windows"
      >
        <path d="M0 3.449L9.75 2.1v9.4H0V3.449zM10.9 1.949L24 0v11.4H10.9V1.949zM0 12.6h9.75v9.4L0 20.649V12.6zM10.9 12.6H24V24l-13.1-1.8V12.6z" />
      </svg>
    );
  }

  if (!icon) {
    return <Monitor className={cn("h-4 w-4", className)} />;
  }

  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-4 w-4 fill-current", className)}
      aria-label={icon.title}
    >
      <path d={icon.path} />
    </svg>
  );
}
