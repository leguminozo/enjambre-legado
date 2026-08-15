let meta = #{
    name: "audit-editor-tienda",
    description: "Audit Store Editor key lists, pairs, publish paths, and preview wiring",
    when_to_use: "After changing Editor de Tienda, CMS keys, or publish/preview",
    phases: [
        #{ title: "Scan", detail: "four read-only slices of the editor" },
        #{ title: "Verify", detail: "skeptics confirm each finding" },
    ],
};

let findings_schema = #{
    "type": "object", "required": ["findings"],
    "properties": #{
        "findings": #{ "type": "array", "maxItems": 8, "items": #{
            "type": "object", "required": ["file", "issue"],
            "properties": #{
                "file": #{ "type": "string" },
                "issue": #{ "type": "string" },
            },
        }},
    },
};
let verdict_schema = #{
    "type": "object", "required": ["real", "reason", "evidence"],
    "properties": #{
        "real": #{ "type": "boolean" },
        "reason": #{ "type": "string" },
        "evidence": #{ "type": "string" },
    },
};

let root = "/Users/macbook/Desktop/oyz app";
if args != () && args.root != () { root = args.root; }

phase("Scan");
let slices = [
    "CMS_SECTION_KEYS vs use-cms-content vs cms.ts SECTION_KEYS — they must be one source",
    "EDITOR_SECTION_PAIRS: media_items/media_settings and other twins must not appear as two nav entries",
    "AUTO_PUBLISH_SECTIONS: landing_layout, media_settings, auth_settings live; legal_* and media_items stay draft",
    "Preview: load-store-chrome.ts ignores draft; legal pages must pass { draft } to getSiteContent",
];
let jobs = [];
let i = 0;
for s in slices {
    let p = "Repo root: " + root + ". Use read_file and grep only. Inspect Editor de Tienda for: ";
    p += s;
    p += " Report at most 8 {file, issue}. Empty findings is valid only after you read the files. Stay under apps/nucleo, apps/tienda, packages/shop-chrome.";
    jobs.push(#{
        prompt: p,
        label: "scan-" + i.to_string(),
        capability_mode: "read-only",
        output_schema: findings_schema,
    });
    i += 1;
}
let results = parallel(jobs);

let findings = [];
for r in results {
    if r != () && r.success && r.output.findings != () {
        for f in r.output.findings {
            if f.file != () {
                let fp = f.file;
                let ok = false;
                if fp.contains("apps/nucleo") { ok = true; }
                if fp.contains("apps/tienda") { ok = true; }
                if fp.contains("packages/shop-chrome") { ok = true; }
                if ok { findings.push(f); }
            }
        }
    }
}
if findings.len() == 0 {
    complete(#{ summary: "No editor-tienda findings.", confirmed: [] });
}

if findings.len() > 8 {
    log("capped findings from " + findings.len().to_string() + " to 8");
    let capped = [];
    let j = 0;
    for f in findings {
        if j < 8 { capped.push(f); }
        j += 1;
    }
    findings = capped;
}

phase("Verify");
let vjobs = [];
for f in findings {
    let vp = "Adversarially verify this Editor de Tienda finding by reading the shipped file. Issue: ";
    vp += f.issue;
    vp += " File: ";
    vp += f.file;
    vp += " Set real=true only with evidence you independently inspected. Else real=false.";
    vjobs.push(#{
        prompt: vp,
        label: "verify",
        capability_mode: "read-only",
        output_schema: verdict_schema,
    });
}
let verdicts = parallel(vjobs);
let confirmed = [];
let k = 0;
for v in verdicts {
    if v != () && v.success && v.output.real == true
        && v.output.evidence != () && v.output.evidence != "" {
        confirmed.push(findings[k]);
    }
    k += 1;
}
log(confirmed.len().to_string() + "/" + findings.len().to_string() + " survived");
complete(#{ summary: confirmed.len().to_string() + " confirmed findings", confirmed: confirmed });
