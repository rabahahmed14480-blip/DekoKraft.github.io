"use client";

import AnnouncementEditorModal, {
  type AnnouncementEditorModalProps,
} from "../../components/announcements/AnnouncementEditorModal";

type AdminAnnouncementEditorProps = Omit<
  AnnouncementEditorModalProps,
  "announcementType"
>;

export default function AdminAnnouncementEditor(
  props: AdminAnnouncementEditorProps,
) {
  return <AnnouncementEditorModal {...props} announcementType="main" />;
}
