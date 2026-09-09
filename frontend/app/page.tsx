"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, Copy, Download, FileCheck2, Plus, Trash2, Upload } from "lucide-react";
import { apiFileUrl, createTemplate, getLatestAnnotation, listTemplates, renderFilledPdf, saveAnnotation } from "@/api/utils";
import type { Annotation, AnnotationField, FieldFormat, TaxFormTemplate } from "@/api/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const sampleData = {
  taxpayer: {
    firstName: "Vivek",
    middleInitial: "K",
    lastName: "Sharma",
    ssn: "123-45-6789",
    spouse: {
      firstName: "Priya",
      middleInitial: "S",
      lastName: "Sharma",
      ssn: "987-65-4321"
    },
    address: { street: "123 Market Street", apartment: "4B", city: "San Francisco", state: "CA", zip: "94105" },
    foreignAddress: { country: "", province: "", postalCode: "" },
    mainHomeInUnitedStatesMoreThanHalfYear: true,
    electionCampaign: true,
    spouseElectionCampaign: false,
    filingStatus: {
      single: true,
      marriedFilingJointly: false,
      marriedFilingSeparately: false,
      headOfHousehold: false,
      qualifyingSurvivingSpouse: false,
      spouseFullNameForMfs: "",
      qualifyingChildNameForHohOrQss: "",
      treatedNonresidentSpouseAsResident: false,
      nonresidentSpouseName: "",
      livedApartFromSpouseLastSixMonths: false
    },
    digitalAssets: { yes: false, no: true },
    dependents: [
      {
        firstName: "Aarav",
        lastName: "Sharma",
        ssn: "222-33-4444",
        relationship: "Son",
        livedWithYouMoreThanHalfYear: true,
        livedInUnitedStates: true,
        fullTimeStudent: false,
        permanentlyDisabled: false,
        childTaxCredit: true,
        creditForOtherDependents: false
      },
      {
        firstName: "Anaya",
        lastName: "Sharma",
        ssn: "333-44-5555",
        relationship: "Daughter",
        livedWithYouMoreThanHalfYear: true,
        livedInUnitedStates: true,
        fullTimeStudent: false,
        permanentlyDisabled: false,
        childTaxCredit: true,
        creditForOtherDependents: false
      }
    ],
    income: {
      wages: "85000",
      householdEmployeeWages: "0",
      tips: "0",
      medicaidWaiverPayments: "0",
      taxableDependentCareBenefits: "0",
      employerProvidedAdoptionBenefits: "0",
      wagesFromForm8919: "0",
      otherEarnedIncomeType: "",
      otherEarnedIncomeAmount: "0",
      nontaxableCombatPayElection: "0",
      totalEarnedIncome: "85000",
      taxExemptInterest: "0",
      taxableInterest: "325",
      qualifiedDividends: "0",
      ordinaryDividends: "0",
      childDividendsIncludedOnLine3a: false,
      childDividendsIncludedOnLine3b: false,
      iraDistributions: "0",
      taxableIraDistributions: "0",
      iraRollover: false,
      iraQcd: false,
      pensionsAndAnnuities: "0",
      taxablePensionsAndAnnuities: "0",
      pensionRollover: false,
      pensionPso: false,
      socialSecurityBenefits: "0",
      taxableSocialSecurityBenefits: "0"
    }
  }
};

const formatTypes: FieldFormat["type"][] = ["text", "decimal", "checkbox"];

function field(
  id: string,
  label: string,
  pointer: string,
  type: FieldFormat["type"],
  x: number,
  y: number,
  width: number,
  height: number,
  align: "left" | "center" | "right" = "left"
): AnnotationField {
  return {
    id,
    label,
    page: 1,
    box: { x, y, width, height },
    pointer,
    format: type === "decimal" ? { type, decimals: 0, grouping: true, negative: "parentheses" } : { type },
    style: { fontSize: type === "checkbox" ? 8 : 9, minFontSize: 6, padding: type === "checkbox" ? 1 : 2, align, overflow: "shrink" },
    missing: "blank"
  };
}

const defaultFields: AnnotationField[] = [
  field("your_first_name_middle_initial", "Your first name and middle initial", "/taxpayer/firstName", "text", 72, 116, 160, 16),
  field("your_last_name", "Last name", "/taxpayer/lastName", "text", 246, 116, 150, 16),
  field("your_social_security_number", "Your social security number", "/taxpayer/ssn", "text", 430, 116, 118, 16),
  field("spouse_first_name_middle_initial", "Spouse first name and middle initial", "/taxpayer/spouse/firstName", "text", 72, 136, 160, 16),
  field("spouse_last_name", "Spouse last name", "/taxpayer/spouse/lastName", "text", 246, 136, 150, 16),
  field("spouse_social_security_number", "Spouse social security number", "/taxpayer/spouse/ssn", "text", 430, 136, 118, 16),
  field("home_address_street", "Home address", "/taxpayer/address/street", "text", 72, 154, 330, 16),
  field("apartment_number", "Apt. no.", "/taxpayer/address/apartment", "text", 430, 154, 80, 16),
  field("city_town_post_office", "City, town, or post office", "/taxpayer/address/city", "text", 72, 190, 255, 16),
  field("state", "State", "/taxpayer/address/state", "text", 350, 190, 42, 16, "center"),
  field("zip_code", "ZIP code", "/taxpayer/address/zip", "text", 430, 190, 95, 16),
  field("presidential_election_campaign_you", "Presidential Election Campaign You", "/taxpayer/electionCampaign", "checkbox", 410, 230, 10, 10, "center"),
  field("presidential_election_campaign_spouse", "Presidential Election Campaign Spouse", "/taxpayer/spouseElectionCampaign", "checkbox", 490, 230, 10, 10, "center"),
  field("filing_status_single", "Filing Status Single", "/taxpayer/filingStatus/single", "checkbox", 72, 268, 10, 10, "center"),
  field("digital_assets_no", "Digital Assets No", "/taxpayer/digitalAssets/no", "checkbox", 532, 346, 10, 10, "center"),
  field("dependent_1_first_name", "Dependent 1 first name", "/taxpayer/dependents/0/firstName", "text", 138, 404, 82, 14),
  field("dependent_1_last_name", "Dependent 1 last name", "/taxpayer/dependents/0/lastName", "text", 225, 404, 82, 14),
  field("dependent_1_ssn", "Dependent 1 SSN", "/taxpayer/dependents/0/ssn", "text", 312, 404, 74, 14),
  field("dependent_1_relationship", "Dependent 1 relationship", "/taxpayer/dependents/0/relationship", "text", 392, 404, 70, 14),
  field("dependent_1_child_tax_credit", "Dependent 1 child tax credit", "/taxpayer/dependents/0/childTaxCredit", "checkbox", 494, 468, 10, 10, "center"),
  field("line_1a_total_w2_wages", "1a Total amount from Forms W-2", "/taxpayer/income/wages", "decimal", 455, 528, 88, 14, "right"),
  field("line_1b_household_employee_wages", "1b Household employee wages", "/taxpayer/income/householdEmployeeWages", "decimal", 455, 548, 88, 14, "right"),
  field("line_1c_tip_income", "1c Tip income", "/taxpayer/income/tips", "decimal", 455, 568, 88, 14, "right"),
  field("line_2a_tax_exempt_interest", "2a Tax-exempt interest", "/taxpayer/income/taxExemptInterest", "decimal", 250, 708, 72, 14, "right"),
  field("line_2b_taxable_interest", "2b Taxable interest", "/taxpayer/income/taxableInterest", "decimal", 455, 708, 88, 14, "right"),
  field("line_3a_qualified_dividends", "3a Qualified dividends", "/taxpayer/income/qualifiedDividends", "decimal", 250, 728, 72, 14, "right"),
  field("line_3b_ordinary_dividends", "3b Ordinary dividends", "/taxpayer/income/ordinaryDividends", "decimal", 455, 728, 88, 14, "right")
];

function emptyField(index: number): AnnotationField {
  return field(`field_${index + 1}`, `Field ${index + 1}`, "", "text", 72, 160 + index * 24, 160, 16);
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function pointerLabel(pointer: string) {
  if (!pointer) return "Select data pointer";
  return pointer
    .slice(1)
    .split("/")
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"))
    .reduce((label, segment) => (/^\d+$/.test(segment) ? `${label}[${segment}]` : label ? `${label}.${segment}` : segment), "");
}

function collectPointers(value: unknown, pointer = ""): Array<{ pointer: string; label: string }> {
  if (value === null || typeof value !== "object") {
    return pointer ? [{ pointer, label: pointerLabel(pointer) }] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectPointers(item, `${pointer}/${index}`));
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const escapedKey = key.replace(/~/g, "~0").replace(/\//g, "~1");
    return collectPointers(child, `${pointer}/${escapedKey}`);
  });
}

export default function Home() {
  const [name, setName] = useState("Form 1040");
  const [taxYear, setTaxYear] = useState("2026");
  const [file, setFile] = useState<File | null>(null);
  const [template, setTemplate] = useState<TaxFormTemplate | null>(null);
  const [templates, setTemplates] = useState<TaxFormTemplate[]>([]);
  const [fields, setFields] = useState<AnnotationField[]>(defaultFields);
  const [selectedFieldId, setSelectedFieldId] = useState(defaultFields[0].id);
  const [tab, setTab] = useState<"field" | "json" | "data">("field");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState(JSON.stringify(sampleData, null, 2));
  const [status, setStatus] = useState("Upload a source PDF to start");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    refreshHistory();
  }, []);

  const annotation = useMemo<Annotation | null>(() => {
    if (!template) return null;
    return {
      specVersion: "1.0.0",
      units: "pt",
      origin: "top-left",
      sourceSha256: template.sourceSha256,
      fields: fields.map(({ label, ...fieldValue }) => fieldValue)
    };
  }, [fields, template]);

  const annotationJson = useMemo(() => JSON.stringify(annotation ?? { fields }, null, 2), [annotation, fields]);
  const pointerOptions = useMemo(() => {
    try {
      return collectPointers(JSON.parse(data));
    } catch {
      return collectPointers(sampleData);
    }
  }, [data]);
  const page = template?.pages[0] ?? { page: 1, width: 612, height: 792 };
  const sourceUrl = template ? apiFileUrl(`/templates/${template.id}/source#toolbar=0&navpanes=0&scrollbar=0`) : "";
  const selectedFieldIndex = fields.findIndex((item) => item.id === selectedFieldId);
  const selectedField = selectedFieldIndex >= 0 ? fields[selectedFieldIndex] : fields[0];

  function setField(index: number, next: AnnotationField) {
    setFields((current) => current.map((item, itemIndex) => (itemIndex === index ? next : item)));
  }

  function setNumber(index: number, key: keyof AnnotationField["box"] | "page", value: string) {
    const currentField = fields[index];
    const numberValue = Number(value) || 0;
    if (key === "page") {
      setField(index, { ...currentField, page: Math.max(1, Math.round(numberValue)) });
      return;
    }
    setField(index, { ...currentField, box: { ...currentField.box, [key]: Math.max(0, numberValue) } });
  }

  function setFormat(index: number, type: FieldFormat["type"]) {
    const currentField = fields[index];
    const format: FieldFormat = type === "decimal" ? { type, decimals: 0, grouping: true, negative: "parentheses" } : { type };
    setField(index, { ...currentField, format });
  }

  async function refreshHistory() {
    try {
      const response = await listTemplates();
      setTemplates(response.items);
    } catch {
      setTemplates([]);
    }
  }

  function newBlankForm() {
    setName("Untitled form");
    setTaxYear("2026");
    setFile(null);
    setTemplate(null);
    setRevision(0);
    setFields([]);
    setSelectedFieldId("");
    setHistoryOpen(false);
    setStatus("Blank draft ready");
  }

  async function openTemplate(nextTemplate: TaxFormTemplate) {
    setBusy(true);
    setTemplate(nextTemplate);
    setName(nextTemplate.name);
    setTaxYear(String(nextTemplate.taxYear));
    setFile(null);
    setStatus("Loading annotation");
    try {
      const latest = await getLatestAnnotation(nextTemplate.id);
      setRevision(latest.revision);
      setFields(latest.annotation.fields);
      setSelectedFieldId(latest.annotation.fields[0]?.id ?? "");
      setStatus(`Loaded revision ${latest.revision}`);
    } catch {
      setRevision(0);
      setFields([]);
      setSelectedFieldId("");
      setStatus("Template loaded with no saved annotation");
    } finally {
      setHistoryOpen(false);
      setBusy(false);
    }
  }

  async function uploadTemplate() {
    if (!file) {
      setStatus("Select a PDF first");
      return;
    }
    setBusy(true);
    setStatus("Uploading PDF");
    try {
      const created = await createTemplate({ name, taxYear: Number(taxYear) || new Date().getFullYear(), file });
      setTemplate(created);
      setRevision(0);
      setStatus(`Template ready: ${created.pages.length} page PDF`);
      await refreshHistory();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveCurrentAnnotation() {
    if (!template || !annotation) {
      setStatus("Upload a PDF first");
      return;
    }
    setBusy(true);
    setStatus("Saving annotation");
    try {
      const saved = await saveAnnotation(template.id, { expectedRevision: revision, annotation });
      setRevision(saved.revision);
      setStatus(`Annotation saved as revision ${saved.revision}`);
      await refreshHistory();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function renderPdf() {
    if (!template) {
      setStatus("Upload a PDF first");
      return;
    }
    if (revision === 0) {
      setStatus("Save annotation before rendering");
      return;
    }
    setBusy(true);
    setStatus("Rendering PDF");
    try {
      const blob = await renderFilledPdf(template.id, { revision, data: JSON.parse(data) });
      downloadBlob(blob, `filled-${name.replaceAll(" ", "-").toLowerCase()}-r${revision}.pdf`);
      setStatus("Filled PDF downloaded");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Render failed");
    } finally {
      setBusy(false);
    }
  }

  function addField() {
    setFields((current) => {
      const next = emptyField(current.length);
      setSelectedFieldId(next.id);
      return [...current, next];
    });
    setTab("field");
  }

  function removeSelectedField() {
    if (!selectedField) return;
    const nextFields = fields.filter((item) => item.id !== selectedField.id);
    setFields(nextFields);
    setSelectedFieldId(nextFields[0]?.id ?? "");
  }

  function copyAnnotation() {
    navigator.clipboard.writeText(annotationJson);
    setStatus("Annotation JSON copied");
  }

  return (
    <main className="h-screen overflow-hidden bg-[#fafafa] text-foreground" onClick={() => setHistoryOpen(false)}>
      <div className="grid h-full grid-rows-[72px_1fr]">
        <header className="flex items-center justify-between border-b bg-white px-6">
          <div>
            <h1 className="text-lg font-semibold">Instead Form Annotator</h1>
            <p className="text-sm text-muted-foreground">{status}</p>
          </div>
          <div className="relative flex gap-2" onClick={(event) => event.stopPropagation()}>
            <Button variant="secondary" size="sm" onClick={newBlankForm}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setHistoryOpen((open) => !open)}>
              <Clock3 className="h-4 w-4" />
            </Button>
            <Button variant="secondary" onClick={copyAnnotation}>
              <Copy className="h-4 w-4" />
              Copy JSON
            </Button>
            <Button variant="secondary" onClick={saveCurrentAnnotation} disabled={busy}>
              <FileCheck2 className="h-4 w-4" />
              Save Annotation
            </Button>
            <Button onClick={renderPdf} disabled={busy}>
              <Download className="h-4 w-4" />
              Render PDF
            </Button>
            {historyOpen ? (
              <div className="absolute right-0 top-12 z-50 w-80 rounded-md border bg-white p-3 shadow-lg">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">History</h2>
                  <span className="text-xs text-muted-foreground">{templates.length} saved</span>
                </div>
                <div className="grid max-h-80 gap-1.5 overflow-auto">
                  {templates.length === 0 ? (
                    <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">No saved forms</div>
                  ) : (
                    templates.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openTemplate(item)}
                        className={`rounded-md px-3 py-2 text-left text-sm hover:bg-muted ${template?.id === item.id ? "bg-muted" : ""}`}
                      >
                        <span className="block truncate font-medium">{item.name}</span>
                        <span className="block text-xs text-muted-foreground">{item.taxYear} · {item.pages.length} pages</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <div className="grid min-h-0 grid-cols-[280px_1fr_380px]">
          <aside className="grid min-h-0 grid-rows-[220px_1fr] border-r bg-white">
            <section className="border-b p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Source</h2>
                <span className="text-xs text-muted-foreground">{template ? `R${revision}` : "Draft"}</span>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-[1fr_76px] gap-2">
                  <Input className="h-8" value={name} onChange={(event) => setName(event.target.value)} />
                  <Input className="h-8" value={taxYear} onChange={(event) => setTaxYear(event.target.value)} />
                </div>
                <Input className="h-8" type="file" accept="application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                <Button size="sm" variant="outline" onClick={uploadTemplate} disabled={busy}>
                  <Upload className="h-4 w-4" />
                  Upload PDF
                </Button>
                <div className="truncate rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{status}</div>
              </div>
            </section>

            <section className="grid min-h-0 grid-rows-[auto_1fr] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Fields</h2>
                <Button size="sm" onClick={addField}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              <div className="grid content-start gap-1.5 overflow-auto">
                {fields.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedFieldId(item.id);
                      setTab("field");
                    }}
                    className={`rounded-md px-3 py-2 text-left text-sm hover:bg-muted ${selectedField?.id === item.id ? "bg-muted" : ""}`}
                  >
                    <span className="block truncate font-medium">{item.label ?? item.id}</span>
                    <span className="block truncate text-xs text-muted-foreground">{item.pointer || "No pointer"}</span>
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <section className="grid min-h-0 grid-rows-[auto_1fr] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Preview</h2>
              <span className="text-xs text-muted-foreground">{page.width} x {page.height} pt</span>
            </div>
            <div className="min-h-0 overflow-auto rounded-md bg-[#eceef1] p-5">
              <div className="relative mx-auto overflow-hidden rounded-sm border bg-white shadow-sm" style={{ width: "min(100%, 720px)", aspectRatio: `${page.width}/${page.height}` }}>
                {sourceUrl ? (
                  <iframe src={sourceUrl} className="absolute inset-0 h-full w-full border-0" title="Source PDF preview" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">Upload a PDF to preview it here</div>
                )}
                {fields.map((item) => (
                  <div
                    key={item.id}
                    className={`pointer-events-none absolute z-10 overflow-hidden rounded-sm px-1 text-[10px] ${
                      selectedField?.id === item.id ? "border border-primary bg-primary/20" : "border border-primary/50 bg-primary/10"
                    }`}
                    style={{
                      left: `${(item.box.x / page.width) * 100}%`,
                      top: `${(item.box.y / page.height) * 100}%`,
                      width: `${(item.box.width / page.width) * 100}%`,
                      height: `${(item.box.height / page.height) * 100}%`
                    }}
                  >
                    {item.label ?? item.id}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="grid min-h-0 grid-rows-[auto_1fr] border-l bg-white p-4">
            <div className="mb-4 grid grid-cols-3 rounded-md bg-muted p-1 text-sm">
              {(["field", "json", "data"] as const).map((item) => (
                <button key={item} type="button" onClick={() => setTab(item)} className={`rounded px-3 py-1.5 capitalize ${tab === item ? "bg-white shadow-sm" : "text-muted-foreground"}`}>
                  {item}
                </button>
              ))}
            </div>

            <div className="min-h-0 overflow-auto">
              {tab === "field" && selectedField ? (
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Field Inspector</h2>
                    <Button variant="ghost" size="sm" onClick={removeSelectedField}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Label</Label>
                    <Input value={selectedField.label ?? selectedField.id} onChange={(event) => setField(selectedFieldIndex, { ...selectedField, label: event.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>ID</Label>
                    <Input
                      value={selectedField.id}
                      onChange={(event) => {
                        setField(selectedFieldIndex, { ...selectedField, id: event.target.value });
                        setSelectedFieldId(event.target.value);
                      }}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Pointer</Label>
                    <select
                      value={selectedField.pointer}
                      onChange={(event) => setField(selectedFieldIndex, { ...selectedField, pointer: event.target.value })}
                      className="h-9 rounded-md border border-input bg-white px-2 text-sm"
                    >
                      <option value="">Select data pointer</option>
                      {pointerOptions.map((option) => (
                        <option key={option.pointer} value={option.pointer}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label>Format</Label>
                      <select value={selectedField.format.type} onChange={(event) => setFormat(selectedFieldIndex, event.target.value as FieldFormat["type"])} className="h-9 rounded-md border border-input bg-white px-2 text-sm">
                        {formatTypes.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Page</Label>
                      <Input value={selectedField.page} onChange={(event) => setNumber(selectedFieldIndex, "page", event.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(["x", "y", "width", "height"] as const).map((item) => (
                      <div key={item} className="grid gap-1.5">
                        <Label>{item}</Label>
                        <Input value={selectedField.box[item]} onChange={(event) => setNumber(selectedFieldIndex, item, event.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {tab === "json" ? (
                <pre className="h-full min-h-[560px] overflow-auto rounded-md bg-muted p-3 text-xs">{annotationJson}</pre>
              ) : null}

              {tab === "data" ? (
                <textarea value={data} onChange={(event) => setData(event.target.value)} className="h-full min-h-[560px] w-full resize-none rounded-md border border-input bg-background p-3 font-mono text-xs outline-none focus:ring-1 focus:ring-ring" />
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
