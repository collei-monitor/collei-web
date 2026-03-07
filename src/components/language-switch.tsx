import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";
export function LanguageSwitch() {
  const { i18n } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Languages />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuCheckboxItem
          checked={i18n.language === "zh-CN"}
          onCheckedChange={() => i18n.changeLanguage("zh-CN")}
        >
          中文 (Simplified)
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={i18n.language === "en-US"}
          onCheckedChange={() => i18n.changeLanguage("en-US")}
        >
          English
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
