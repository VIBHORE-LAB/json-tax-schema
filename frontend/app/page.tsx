"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto grid max-w-6xl gap-6">
        <header className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Instead Form Annotator</h1>
            <p className="text-sm text-muted-foreground">Client-side workspace for mapping tax form boxes to structured data.</p>
          </div>
          <Button>New Template</Button>
        </header>

        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Template</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="form-name">Form name</Label>
                <Input id="form-name" placeholder="Form 1040" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tax-year">Tax year</Label>
                <Input id="tax-year" placeholder="2026" />
              </div>
              <Button variant="secondary">Save Draft</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Canvas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex aspect-[8.5/11] items-center justify-center rounded-md border bg-muted text-sm text-muted-foreground">
                Upload and annotate tax form fields here
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
