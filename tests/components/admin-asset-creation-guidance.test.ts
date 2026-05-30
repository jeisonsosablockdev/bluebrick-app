// @vitest-environment jsdom

import { act, createElement, Fragment } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AssetCollectionSection,
  AssetCommercialDescriptionSection,
  AssetIdentificationSection,
  AssetImportSection,
  AssetLocationSection,
  AssetMediaSection,
  AssetTypeSelectionSection,
  GuidanceBadge
} from "@/components/admin/asset-creation/sections";
import { assetTypeOptions } from "@/components/admin/asset-creation/asset-type-options";
import { initialAssetForm } from "@/components/admin/asset-creation/types";

import type { ReactNode } from "react";
import type { AssetForm } from "@/components/admin/asset-creation/types";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

const t = (copy: { en: string; es: string; pt: string }) => copy.es;
const setForm = vi.fn<(value: AssetForm | ((prev: AssetForm) => AssetForm)) => void>();

function renderNode(node: ReactNode): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(node);
  });

  return { container, root };
}

describe("components/admin/asset-creation guidance", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("renders contextual guidance across non-location creation sections", () => {
    const { container, root } = renderNode(
      createElement(
        Fragment,
        null,
        createElement(AssetTypeSelectionSection, {
          t,
          form: initialAssetForm,
          setForm,
          options: [
            {
              value: "building_new",
              title: { en: "New building", es: "Edificio nuevo", pt: "Edificio novo" },
              subtitle: { en: "Stage asset", es: "Activo por etapa", pt: "Ativo por etapa" }
            }
          ]
        }),
        createElement(AssetImportSection, {
          t,
          importFileName: "",
          importText: "",
          importPreviewCount: 0,
          importHeaders: [],
        importMessage: "",
        hasLoadedImport: false,
        replaceImportOpen: false,
        pendingImportLabel: "",
        isFileDropActive: false,
        setImportText: vi.fn(),
        onImportFileInput: vi.fn(async () => {}),
        onImportFileDragOver: vi.fn(),
        onImportFileDragLeave: vi.fn(),
        onImportFileDrop: vi.fn(),
        onImportTextareaPaste: vi.fn(),
        onConfirmReplaceImport: vi.fn(),
        onCancelReplaceImport: vi.fn()
        }),
        createElement(AssetIdentificationSection, { t, form: initialAssetForm, setForm }),
        createElement(AssetCommercialDescriptionSection, { t, form: initialAssetForm, setForm }),
        createElement(AssetMediaSection, {
          t,
          form: initialAssetForm,
          dragTargetField: null,
          setForm,
          onFileDragOver: () => vi.fn(),
          onFileDragLeave: () => vi.fn(),
          onFileDrop: () => vi.fn(),
          onFileInput: () => vi.fn(),
          uploadFieldValue: () => "",
          renderUploadFieldFeedback: () => null
        }),
        createElement(AssetCollectionSection, {
          t,
          form: initialAssetForm,
          setForm,
          setCollectionNameManual: vi.fn(),
          setCollectionSymbolManual: vi.fn(),
          onResetSuggestedValues: vi.fn()
        })
      )
    );

    const helperLabels = Array.from(container.querySelectorAll("button[aria-label]")).map((button) =>
      button.getAttribute("aria-label")
    );

    expect(helperLabels).toContain("Ayuda de tipo de activo");
    expect(helperLabels).toContain("Ayuda de archivo de importacion");
    expect(helperLabels).toContain("Ayuda de tabla pegada");
    expect(helperLabels).toContain("Ayuda de nombre del activo");
    expect(helperLabels).toContain("Ayuda de descripcion corta");
    expect(helperLabels).toContain("Ayuda de imagen de portada");
    expect(helperLabels).toContain("Ayuda de nombre de coleccion");

    act(() => {
      root.unmount();
    });
  });

  it("shows the tooltip only when the local hint icon is hovered", () => {
    const { container, root } = renderNode(
      createElement(GuidanceBadge, {
        hint: "Resumen breve",
        tooltip: "Explains how the field is used",
        ariaLabel: "Ayuda de ejemplo"
      })
    );

    const button = container.querySelector("button[aria-label='Ayuda de ejemplo']");

    expect(button).not.toBeNull();
    expect(document.body.querySelector("[role='tooltip']")).toBeNull();

    act(() => {
      button?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });

    const tooltip = document.body.querySelector("[role='tooltip']");
    expect(tooltip).not.toBeNull();
    expect(tooltip?.textContent).toContain("Resumen breve");
    expect(tooltip?.textContent).toContain("Explains how the field is used");

    act(() => {
      button?.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    });

    expect(document.body.querySelector("[role='tooltip']")).toBeNull();

    act(() => {
      root.unmount();
    });
  });

  it("keeps the location section free of contextual hint controls", () => {
    const form = {
      ...initialAssetForm,
      country: "CO",
      city: "Bogota"
    };

    const { container, root } = renderNode(createElement(AssetLocationSection, { t, form, setForm }));

    expect(container.querySelectorAll("button[aria-label]").length).toBe(0);

    act(() => {
      root.unmount();
    });
  });

  it("wires drag and drop on the quick import dropzone", () => {
    const onImportFileDragOver = vi.fn();
    const onImportFileDragLeave = vi.fn();
    const onImportFileDrop = vi.fn();

    const { container, root } = renderNode(
      createElement(AssetImportSection, {
        t,
        importFileName: "",
        importText: "",
        importPreviewCount: 0,
        importHeaders: [],
        importMessage: "",
        hasLoadedImport: false,
        replaceImportOpen: false,
        pendingImportLabel: "",
        isFileDropActive: false,
        setImportText: vi.fn(),
        onImportFileInput: vi.fn(async () => {}),
        onImportFileDragOver,
        onImportFileDragLeave,
        onImportFileDrop,
        onImportTextareaPaste: vi.fn(),
        onConfirmReplaceImport: vi.fn(),
        onCancelReplaceImport: vi.fn()
      })
    );

    const dropzone = container.querySelector("[data-testid='quick-import-dropzone']");
    expect(dropzone).not.toBeNull();

    act(() => {
      dropzone?.dispatchEvent(new Event("dragover", { bubbles: true, cancelable: true }));
      dropzone?.dispatchEvent(new Event("dragleave", { bubbles: true, cancelable: true }));
      dropzone?.dispatchEvent(new Event("drop", { bubbles: true, cancelable: true }));
    });

    expect(onImportFileDragOver).toHaveBeenCalled();
    expect(onImportFileDragLeave).toHaveBeenCalled();
    expect(onImportFileDrop).toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });

  it("uses the new investment strategy labels for the asset type chooser", () => {
    expect(assetTypeOptions).toEqual([
      {
        value: "building_new",
        title: { en: "FIX & FLIP", es: "FIX & FLIP", pt: "FIX & FLIP" },
        subtitle: { en: "Capital Growth", es: "Crecimiento de capital", pt: "Crescimento de capital" }
      },
      {
        value: "rental_property",
        title: { en: "FIX & HOLD", es: "FIX & HOLD", pt: "FIX & HOLD" },
        subtitle: { en: "Recurring Income", es: "Ingresos recurrentes", pt: "Renda recorrente" }
      },
      {
        value: "land_lot",
        title: { en: "REAL ESTATE DEV", es: "REAL ESTATE DEV", pt: "REAL ESTATE DEV" },
        subtitle: { en: "Projects from scratch", es: "Proyectos desde cero", pt: "Projetos do zero" }
      }
    ]);
  });
});
