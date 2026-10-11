import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { apiRequest, authApi } from "@/lib/api";
import { Check, Loader2, Pencil, Save, X } from "lucide-react";

const TABLE_NAME = "page_content";

const AdminSiteEditor = () => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const saveMarkup = async () => {
    const main = document.querySelector("main");
    if (!main) return;
    setIsSaving(true);
    let error: Error | null = null;
    try {
      await apiRequest("/api/page-content", {
        method: "PUT",
        auth: true,
        body: {
          path: location.pathname,
          html: main.innerHTML,
        },
      });
    } catch (err: any) {
      error = err;
    }
    setIsSaving(false);

    if (error) {
      console.error("Ошибка сохранения в Supabase:", error.message);
    }
  };

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { user } = await authApi.getSession();
        if (!mounted) return;
        setIsAdmin(Boolean(user));
      } catch (_error) {
        if (!mounted) return;
        setIsAdmin(false);
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    document.designMode = isAdmin && isEditMode ? "on" : "off";

    return () => {
      document.designMode = "off";
    };
  }, [isAdmin, isEditMode]);

  useEffect(() => {
    if (!isAdmin) return;

    const onSave = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveMarkup();
      }
    };

    window.addEventListener("keydown", onSave);
    return () => window.removeEventListener("keydown", onSave);
  }, [isAdmin, location.pathname]);

  if (!isAdmin) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-24 z-[1000] min-w-[230px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          <p className="mb-2 text-xs font-semibold text-slate-700">Редактор (админ)</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditMode((prev) => !prev)}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                isEditMode ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {isEditMode ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
              {isEditMode ? "Редактирование вкл" : "Редактирование выкл"}
            </button>
            <button
              type="button"
              onClick={saveMarkup}
              disabled={isSaving}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Сохранить для всех
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center rounded-md bg-slate-100 p-1 text-slate-700"
              aria-label="Свернуть виджет редактора"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <button
        data-admin-editor-widget="true"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed bottom-6 right-24 z-[1000] flex h-12 w-12 items-center justify-center rounded-full border shadow-lg backdrop-blur transition hover:scale-105 ${
          isEditMode
            ? "border-indigo-600 bg-indigo-600 text-white"
            : "border-slate-300 bg-white/95 text-slate-700 hover:bg-slate-50"
        }`}
        title="Открыть инструменты редактирования"
        aria-label="Открыть инструменты редактирования"
      >
        <Pencil className="h-5 w-5" />
      </button>
    </>
  );
};

export default AdminSiteEditor;
