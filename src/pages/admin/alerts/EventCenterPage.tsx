import { useTranslation } from "react-i18next";

export default function EventCenterPage() {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t("admin.sidebar.eventCenter")}</h1>
    </div>
  );
}
