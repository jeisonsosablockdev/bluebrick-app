import type { ChangeEvent, DragEvent, ReactElement } from "react";

import { Card } from "@/components/ui/card";

import { GuidedFieldHeader, GuidedInputField } from "@/features/admin/presentation/asset-creation/sections/guided-field";
import type { AssetForm, FileUploadField } from "@/features/admin/presentation/asset-creation/types";
import type { SectionT } from "@/features/admin/presentation/asset-creation/sections/section-types";

type SetStateAction<T> = T | ((prev: T) => T);

type AssetMediaSectionProps = {
  t: SectionT;
  form: AssetForm;
  dragTargetField: FileUploadField | null;
  setForm: (value: SetStateAction<AssetForm>) => void;
  onFileDragOver: (field: FileUploadField) => (event: DragEvent<HTMLDivElement>) => void;
  onFileDragLeave: (field: FileUploadField) => (event: DragEvent<HTMLDivElement>) => void;
  onFileDrop: (field: FileUploadField) => (event: DragEvent<HTMLDivElement>) => void;
  onFileInput: (field: FileUploadField) => (event: ChangeEvent<HTMLInputElement>) => void;
  uploadFieldValue: (field: FileUploadField) => string;
  renderUploadFieldFeedback: (field: FileUploadField) => ReactElement | null;
};

export function AssetMediaSection({
  t,
  form,
  dragTargetField,
  setForm,
  onFileDragOver,
  onFileDragLeave,
  onFileDrop,
  onFileInput,
  uploadFieldValue,
  renderUploadFieldFeedback
}: AssetMediaSectionProps): ReactElement {
  return (
    <Card className="space-y-3">
      <p className="text-sm font-semibold text-white">{t({ en: "Media and documents", es: "Media y documentos", pt: "Midia e documentos" })}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
          <div className="space-y-1 text-xs text-white/70">
            <GuidedFieldHeader
              label={t({ en: "Cover image", es: "Imagen de portada", pt: "Imagem de capa" })}
              hint={t({ en: "Main collection image stored on Solana and reused by all ordinals.", es: "Imagen principal de la coleccion que quedara en Solana y usaran todos los ordinales.", pt: "Imagem principal da colecao que ficara em Solana e sera usada por todos os ordinais." })}
              tooltip={t({ en: "This is the base image for the ordinal collection. It is stored on Solana and every ordinal will use it.", es: "Esta es la imagen base de la coleccion de ordinales. Quedara en Solana y todos los ordinales la usaran.", pt: "Esta e a imagem base da colecao de ordinais. Ela ficara em Solana e todos os ordinais vao usa-la." })}
              ariaLabel={t({ en: "Cover image help", es: "Ayuda de imagen de portada", pt: "Ajuda de imagem de capa" })}
            />
          </div>
          <div
            className={`mt-2 rounded-xl border border-dashed p-3 transition ${
              dragTargetField === "coverImage"
                ? "border-cyan-300/70 bg-cyan-500/10"
                : "border-white/20 bg-slate-900/50"
            }`}
            onDragOver={onFileDragOver("coverImage")}
            onDragLeave={onFileDragLeave("coverImage")}
            onDrop={onFileDrop("coverImage")}
          >
            <input id="upload-coverImage" className="sr-only" type="file" onChange={onFileInput("coverImage")} />
            <p className="text-xs text-white/60">{t({ en: "Drag and drop file here", es: "Arrastra y suelta archivo aqui", pt: "Arraste e solte arquivo aqui" })}</p>
            <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" htmlFor="upload-coverImage">
              {t({ en: "Choose file", es: "Elegir archivo", pt: "Escolher arquivo" })}
            </label>
          </div>
          <p className="mt-1 max-h-16 overflow-y-auto break-all pr-1 text-xs leading-relaxed text-white/60">{form.coverImage || t({ en: "No file", es: "Sin archivo", pt: "Sem arquivo" })}</p>
          {renderUploadFieldFeedback("coverImage")}
        </label>
        <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
          <div className="space-y-1 text-xs text-white/70">
            <GuidedFieldHeader
              label={t({ en: "Gallery images", es: "Imagenes de galeria", pt: "Imagens de galeria" })}
              hint={t({ en: "Optional supporting images that will also be shown in the marketplace.", es: "Imagenes de apoyo opcionales que tambien se mostraran en el marketplace.", pt: "Imagens de apoio opcionais que tambem serao exibidas no marketplace." })}
              tooltip={t({ en: "Add extra images that help explain the asset beyond the cover image and enrich the marketplace detail view.", es: "Agrega imagenes extra que ayuden a explicar el activo mas alla de la portada y enriquezcan el detalle del marketplace.", pt: "Adicione imagens extras que ajudem a explicar o ativo alem da capa e enriqueçam a pagina de detalhe no marketplace." })}
              ariaLabel={t({ en: "Gallery images help", es: "Ayuda de imagenes de galeria", pt: "Ajuda de imagens de galeria" })}
            />
          </div>
          <div
            className={`mt-2 rounded-xl border border-dashed p-3 transition ${
              dragTargetField === "galleryImages"
                ? "border-cyan-300/70 bg-cyan-500/10"
                : "border-white/20 bg-slate-900/50"
            }`}
            onDragOver={onFileDragOver("galleryImages")}
            onDragLeave={onFileDragLeave("galleryImages")}
            onDrop={onFileDrop("galleryImages")}
          >
            <input id="upload-galleryImages" className="sr-only" type="file" multiple onChange={onFileInput("galleryImages")} />
            <p className="text-xs text-white/60">{t({ en: "Drag and drop files here", es: "Arrastra y suelta archivos aqui", pt: "Arraste e solte arquivos aqui" })}</p>
            <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" htmlFor="upload-galleryImages">
              {t({ en: "Choose files", es: "Elegir archivos", pt: "Escolher arquivos" })}
            </label>
          </div>
          <p className="mt-1 max-h-16 overflow-y-auto break-all pr-1 text-xs leading-relaxed text-white/60">{uploadFieldValue("galleryImages") || t({ en: "No files", es: "Sin archivos", pt: "Sem arquivos" })}</p>
          {renderUploadFieldFeedback("galleryImages")}
        </label>
        <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
          <div className="space-y-1 text-xs text-white/70">
            <GuidedFieldHeader
              label={t({ en: "Brochure file", es: "Archivo brochure", pt: "Arquivo brochure" })}
              hint={t({ en: "Downloadable brochure or brief that will be shown in the marketplace.", es: "Brochure o brief descargable que se mostrara en el marketplace.", pt: "Brochure ou brief para download que sera exibido no marketplace." })}
              tooltip={t({ en: "Use the main downloadable brochure or investment brief so marketplace users can review the asset documentation.", es: "Usa el brochure descargable principal o brief de inversion para que los usuarios del marketplace puedan revisar la documentacion del activo.", pt: "Use o brochure principal para download ou brief de investimento para que os usuarios do marketplace possam revisar a documentacao do ativo." })}
              ariaLabel={t({ en: "Brochure file help", es: "Ayuda de archivo brochure", pt: "Ajuda de arquivo brochure" })}
            />
          </div>
          <div
            className={`mt-2 rounded-xl border border-dashed p-3 transition ${
              dragTargetField === "brochureFile"
                ? "border-cyan-300/70 bg-cyan-500/10"
                : "border-white/20 bg-slate-900/50"
            }`}
            onDragOver={onFileDragOver("brochureFile")}
            onDragLeave={onFileDragLeave("brochureFile")}
            onDrop={onFileDrop("brochureFile")}
          >
            <input id="upload-brochureFile" className="sr-only" type="file" onChange={onFileInput("brochureFile")} />
            <p className="text-xs text-white/60">{t({ en: "Drag and drop file here", es: "Arrastra y suelta archivo aqui", pt: "Arraste e solte arquivo aqui" })}</p>
            <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" htmlFor="upload-brochureFile">
              {t({ en: "Choose file", es: "Elegir archivo", pt: "Escolher arquivo" })}
            </label>
          </div>
          <p className="mt-1 max-h-16 overflow-y-auto break-all pr-1 text-xs leading-relaxed text-white/60">{form.brochureFile || t({ en: "No file", es: "Sin archivo", pt: "Sem arquivo" })}</p>
          {renderUploadFieldFeedback("brochureFile")}
        </label>
        <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
          <div className="space-y-1 text-xs text-white/70">
            <GuidedFieldHeader
              label={t({ en: "Legal documents", es: "Documentos legales", pt: "Documentos legais" })}
              hint={t({ en: "Optional legal files that can be shown in the marketplace.", es: "Archivos legales opcionales que pueden mostrarse en el marketplace.", pt: "Arquivos legais opcionais que podem ser exibidos no marketplace." })}
              tooltip={t({ en: "Upload contracts, certificates, or similar legal backup files when they should be available from the marketplace experience.", es: "Sube contratos, certificados u otros respaldos legales similares cuando deban estar disponibles en la experiencia del marketplace.", pt: "Envie contratos, certificados ou outros respaldos legais semelhantes quando eles precisarem estar disponiveis na experiencia do marketplace." })}
              ariaLabel={t({ en: "Legal documents help", es: "Ayuda de documentos legales", pt: "Ajuda de documentos legais" })}
            />
          </div>
          <div
            className={`mt-2 rounded-xl border border-dashed p-3 transition ${
              dragTargetField === "legalDocs"
                ? "border-cyan-300/70 bg-cyan-500/10"
                : "border-white/20 bg-slate-900/50"
            }`}
            onDragOver={onFileDragOver("legalDocs")}
            onDragLeave={onFileDragLeave("legalDocs")}
            onDrop={onFileDrop("legalDocs")}
          >
            <input id="upload-legalDocs" className="sr-only" type="file" multiple onChange={onFileInput("legalDocs")} />
            <p className="text-xs text-white/60">{t({ en: "Drag and drop files here", es: "Arrastra y suelta archivos aqui", pt: "Arraste e solte arquivos aqui" })}</p>
            <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" htmlFor="upload-legalDocs">
              {t({ en: "Choose files", es: "Elegir archivos", pt: "Escolher arquivos" })}
            </label>
          </div>
          <p className="mt-1 max-h-16 overflow-y-auto break-all pr-1 text-xs leading-relaxed text-white/60">{uploadFieldValue("legalDocs") || t({ en: "No files", es: "Sin archivos", pt: "Sem arquivos" })}</p>
          {renderUploadFieldFeedback("legalDocs")}
        </label>
        <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
          <div className="space-y-1 text-xs text-white/70">
            <GuidedFieldHeader
              label={t({ en: "Financial documents", es: "Documentos financieros", pt: "Documentos financeiros" })}
              hint={t({ en: "Optional financial files that can also be exposed in the marketplace.", es: "Archivos financieros opcionales que tambien pueden mostrarse en el marketplace.", pt: "Arquivos financeiros opcionais que tambem podem ser exibidos no marketplace." })}
              tooltip={t({ en: "Use this for spreadsheets, reports, or finance support material tied to the deal when that documentation should be available in the marketplace.", es: "Usa esto para hojas, reportes o material financiero de soporte ligado al deal cuando esa documentacion deba estar disponible en el marketplace.", pt: "Use isto para planilhas, relatorios ou material financeiro de suporte ligado ao deal quando essa documentacao precisar estar disponivel no marketplace." })}
              ariaLabel={t({ en: "Financial documents help", es: "Ayuda de documentos financieros", pt: "Ajuda de documentos financeiros" })}
            />
          </div>
          <div
            className={`mt-2 rounded-xl border border-dashed p-3 transition ${
              dragTargetField === "financialDocs"
                ? "border-cyan-300/70 bg-cyan-500/10"
                : "border-white/20 bg-slate-900/50"
            }`}
            onDragOver={onFileDragOver("financialDocs")}
            onDragLeave={onFileDragLeave("financialDocs")}
            onDrop={onFileDrop("financialDocs")}
          >
            <input id="upload-financialDocs" className="sr-only" type="file" multiple onChange={onFileInput("financialDocs")} />
            <p className="text-xs text-white/60">{t({ en: "Drag and drop files here", es: "Arrastra y suelta archivos aqui", pt: "Arraste e solte arquivos aqui" })}</p>
            <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" htmlFor="upload-financialDocs">
              {t({ en: "Choose files", es: "Elegir archivos", pt: "Escolher arquivos" })}
            </label>
          </div>
          <p className="mt-1 max-h-16 overflow-y-auto break-all pr-1 text-xs leading-relaxed text-white/60">{uploadFieldValue("financialDocs") || t({ en: "No files", es: "Sin archivos", pt: "Sem arquivos" })}</p>
          {renderUploadFieldFeedback("financialDocs")}
        </label>
        <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
          <div className="space-y-1 text-xs text-white/70">
            <GuidedFieldHeader
              label={t({ en: "Property images", es: "Imagenes del inmueble", pt: "Imagens do imovel" })}
              hint={t({ en: "Optional extra property images that will help contextualize the marketplace listing.", es: "Imagenes extra opcionales del inmueble que ayudaran a contextualizar la publicacion del marketplace.", pt: "Imagens extras opcionais do imovel que ajudarao a contextualizar a listagem no marketplace." })}
              tooltip={t({ en: "Use this set for site, building, or unit photos beyond the main gallery when those visuals should be visible in the marketplace.", es: "Usa este set para fotos del sitio, edificio o unidad mas alla de la galeria principal cuando esos visuales deban verse en el marketplace.", pt: "Use este conjunto para fotos do local, edificio ou unidade alem da galeria principal quando esses visuais precisarem aparecer no marketplace." })}
              ariaLabel={t({ en: "Property images help", es: "Ayuda de imagenes del inmueble", pt: "Ajuda de imagens do imovel" })}
            />
          </div>
          <div
            className={`mt-2 rounded-xl border border-dashed p-3 transition ${
              dragTargetField === "propertyImages"
                ? "border-cyan-300/70 bg-cyan-500/10"
                : "border-white/20 bg-slate-900/50"
            }`}
            onDragOver={onFileDragOver("propertyImages")}
            onDragLeave={onFileDragLeave("propertyImages")}
            onDrop={onFileDrop("propertyImages")}
          >
            <input id="upload-propertyImages" className="sr-only" type="file" multiple onChange={onFileInput("propertyImages")} />
            <p className="text-xs text-white/60">{t({ en: "Drag and drop files here", es: "Arrastra y suelta archivos aqui", pt: "Arraste e solte arquivos aqui" })}</p>
            <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" htmlFor="upload-propertyImages">
              {t({ en: "Choose files", es: "Elegir archivos", pt: "Escolher arquivos" })}
            </label>
          </div>
          <p className="mt-1 max-h-16 overflow-y-auto break-all pr-1 text-xs leading-relaxed text-white/60">{uploadFieldValue("propertyImages") || t({ en: "No files", es: "Sin archivos", pt: "Sem arquivos" })}</p>
          {renderUploadFieldFeedback("propertyImages")}
        </label>
      </div>
      <GuidedInputField
        label={t({ en: "Video URL", es: "URL de video", pt: "URL de video" })}
        hint={t({ en: "Optional public video that can complement the marketplace listing.", es: "Video publico opcional que puede complementar la publicacion del marketplace.", pt: "Video publico opcional que pode complementar a listagem no marketplace." })}
        tooltip={t({ en: "Use a public video link only when it helps explain the asset visually and should be accessible from the marketplace.", es: "Usa un enlace publico de video solo cuando ayude a explicar visualmente el activo y deba ser accesible desde el marketplace.", pt: "Use um link publico de video apenas quando ele ajudar a explicar visualmente o ativo e precisar estar acessivel no marketplace." })}
        ariaLabel={t({ en: "Video URL help", es: "Ayuda de URL de video", pt: "Ajuda de URL de video" })}
        placeholder={t({ en: "videoUrl optional", es: "videoUrl opcional", pt: "videoUrl opcional" })}
        value={form.videoUrl}
        onChange={(event) => setForm((prev) => ({ ...prev, videoUrl: event.target.value }))}
      />
    </Card>
  );
}
