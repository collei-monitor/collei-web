import { useTranslation } from "react-i18next";

export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t("admin.sidebar.settings")}</h1>
    </div>
  );
}
