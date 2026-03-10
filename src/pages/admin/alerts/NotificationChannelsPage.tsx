import { useTranslation } from "react-i18next";

export default function NotificationChannelsPage() {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t("admin.sidebar.notificationChannels")}</h1>
    </div>
  );
}
