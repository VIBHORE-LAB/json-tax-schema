"use client";

import { useMemo, useState } from "react";
import { Download, FileCheck2, Plus, RefreshCw, Save, Trash2, Wand2 } from "lucide-react";
import { createTemplate, previewTemplate, renderFilledPdf, validateAnnotations } from "@/api/utils";
import type { AnnotationField, FieldFormat } from "@/api/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const defaultSampleData = {
  taxpayer: {
    firstName: "Vivek",
    lastName: "Sharma",
    ssn: "123-45-6789",
    income: {
      wages: 85000,
      interest: 325
    }
  }
};

const defaultFields: AnnotationField[] = [
  {
    id: "taxpayer_name",
    label: "Taxpayer name",
    box: { page: 1, x: 0.12, y: 0.18, width: 0.32, height: 0.025 },
    expression: "concat(taxpayer.firstName, ' ', taxpayer.lastName)",
    format: { type: "text", fontSize: 10, align: "left", overflow: "shrink" }
  },
  {
    id: "wages_line_1",
    label: "Line 1 wages",
    box: { page: 1, x: 0.72, y: 0.42, width: 0.16, height: 0.025 },
    dataPath: "taxpayer.income.wages",
    format: { type: "currency", fontSize: 10, align: "right", rounding: "nearest-dollar", negativeStyle: "parentheses" }
  }
];

const formatTypes: FieldFormat["type"][] = ["text", "number", "currency", "date", "checkbox", "ssn", "ein", "phone"];

function emptyField(index: number): AnnotationField {
  return {
    id: `field_${index + 1}`,
    label: `Field ${index + 1}`,
    box: { page: 1, x: 0.1, y: 0.1, width: 0.2, height: 0.025 },
    dataPath: "",
    format: { type: "text", fontSize: 10, align: "left", overflow: "shrink" }
  };
}

function parseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export default function Home() {
  const [name, setName] = useState("Form 1040");
  const [taxYear, setTaxYear] = useState("2026");
  const [formVersion, setFormVersion] = useState("irs-2026-draft");
  const [pages, setPages] = useState("2");
  const [fields, setFields] = useState<AnnotationField[]>(defaultFields);
  const [sampleData, setSampleData] = useState(JSON.stringify(defaultSampleData, null, 2));
  const [status, setStatus] = useState("Ready");
  const [busy, setBusy] = useState(false);

  const templatePayload = useMemo(
    () => ({
      name,
      taxYear: Number(taxYear) || new Date().getFullYear(),
      formVersion,
      pages: Number(pages) || 1,
      fields
    }),
    [fields, formVersion, name, pages, taxYear]
  );

  const templateJson = useMemo(() => JSON.stringify(templatePayload, null, 2), [templatePayload]);

  function updateField(index: number, next: AnnotationField) {
    setFields((current) => current.map((field, fieldIndex) => (fieldIndex === index ? next : field)));
  }

  function updateBox(index: number, key: keyof AnnotationField["box"], value: string) {
    const nextValue = key === "page" ? Math.max(1, Number(value) || 1) : Math.min(1, Math.max(0, Number(value) || 0));
    const field = fields[index];
    updateField(index, { ...field, box: { ...field.box, [key]: nextValue } });
  }

  function updateFormat(index: number, key: keyof FieldFormat, value: string) {
    const field = fields[index];
    const nextValue = key === "fontSize" ? Number(value) || 10 : value;
    updateField(index, { ...field, format: { ...field.format, [key]: nextValue } });
  }

  async function runAction(action: "save" | "validate" | "preview" | "render") {
    setBusy(true);
    setStatus("Working");

    try {
      if (action === "save") {
        const result = await createTemplate(templatePayload);
        setStatus(`Saved ${result.name}`);
      }

      if (action === "validate") {
        const result = await validateAnnotations(fields);
        setStatus(result.valid ? "Annotations valid" : result.errors.join(", "));
      }

      if (action === "preview" || action === "render") {
        const data = parseJson(sampleData);
        if (!data) {
          setStatus("Sample data JSON is invalid");
          return;
        }

        const result =
          action === "preview"
            ? await previewTemplate({ templateId: "draft", data })
            : await renderFilledPdf({ templateId: "draft", data });
        setStatus(result.url ? `${action} ready: ${result.fileName}` : `${action} completed`);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  function copyTemplateJson() {
    navigator.clipboard.writeText(templateJson);
    setStatus("Annotation JSON copied");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid max-w-7xl gap-5 p-5">
        <header className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Instead Form Annotator</h1>
            <p className="text-sm text-muted-foreground">Build normalized field maps and connect them to nested taxpayer data.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => runAction("validate")} disabled={busy}>
              <FileCheck2 className="h-4 w-4" />
              Validate
            </Button>
            <Button variant="secondary" onClick={() => runAction("preview")} disabled={busy}>
              <Wand2 className="h-4 w-4" />
              Preview
            </Button>
            <Button variant="secondary" onClick={() => runAction("render")} disabled={busy}>
              <Download className="h-4 w-4" />
              Render
            </Button>
            <Button onClick={() => runAction("save")} disabled={busy}>
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </header>

        <section className="grid gap-5 xl:grid-cols-[340px_1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Template</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Form name</Label>
                <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tax-year">Tax year</Label>
                <Input id="tax-year" value={taxYear} onChange={(event) => setTaxYear(event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="version">Version</Label>
                <Input id="version" value={formVersion} onChange={(event) => setFormVersion(event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pages">Pages</Label>
                <Input id="pages" value={pages} onChange={(event) => setPages(event.target.value)} />
              </div>
              <Button variant="outline" onClick={copyTemplateJson}>
                <Download className="h-4 w-4" />
                Copy JSON
              </Button>
              <div className="rounded-md border bg-muted p-3 text-sm text-muted-foreground">{status}</div>
            </CardContent>
          </Card>

          <div className="grid gap-5">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Fields</CardTitle>
                <Button size="sm" onClick={() => setFields((current) => [...current, emptyField(current.length)])}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </CardHeader>
              <CardContent className="grid gap-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid gap-4 rounded-md border p-4">
                    <div className="grid gap-3 lg:grid-cols-[1fr_1fr_150px_44px]">
                      <Input value={field.id} onChange={(event) => updateField(index, { ...field, id: event.target.value })} />
                      <Input value={field.label} onChange={(event) => updateField(index, { ...field, label: event.target.value })} />
                      <select
                        value={field.format.type}
                        onChange={(event) => updateFormat(index, "type", event.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {formatTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFields((current) => current.filter((_, fieldIndex) => fieldIndex !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      <Input
                        placeholder="data.path"
                        value={field.dataPath ?? ""}
                        onChange={(event) => updateField(index, { ...field, dataPath: event.target.value, expression: "" })}
                      />
                      <Input
                        placeholder="expression"
                        value={field.expression ?? ""}
                        onChange={(event) => updateField(index, { ...field, expression: event.target.value, dataPath: "" })}
                      />
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                      {(["page", "x", "y", "width", "height"] as const).map((key) => (
                        <div key={key} className="grid gap-2" >
                          <Label>{key}</Label>
                          <Input value={field.box[key]} onChange={(event) => updateBox(index, key, event.target.value)} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Form Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative mx-auto aspect-[8.5/11] max-h-[760px] rounded-md border bg-white">
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      className="absolute overflow-hidden rounded-sm border border-primary/70 bg-primary/10 px-1 text-[10px]"
                      style={{
                        left: `${field.box.x * 100}%`,
                        top: `${field.box.y * 100}%`,
                        width: `${field.box.width * 100}%`,
                        height: `${field.box.height * 100}%`
                      }}
                    >
                      {field.label}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-5">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Sample Data</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSampleData(JSON.stringify(defaultSampleData, null, 2))}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <textarea
                  value={sampleData}
                  onChange={(event) => setSampleData(event.target.value)}
                  className="h-[260px] w-full resize-none rounded-md border border-input bg-background p-3 font-mono text-xs outline-none focus:ring-1 focus:ring-ring"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Annotation JSON</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="max-h-[520px] overflow-auto rounded-md border bg-muted p-3 text-xs">{templateJson}</pre>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
