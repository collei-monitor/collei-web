import { useTranslation } from "react-i18next";

export default function AlertEnginePage() {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t("admin.sidebar.alertEngine")}</h1>
    </div>
  );
}
