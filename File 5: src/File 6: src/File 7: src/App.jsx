
```jsx
import { useState, useMemo, useEffect } from "react";
import { supabase } from "./supabaseClient";

const COUNTRIES = ["Denmark","Finland","France","Germany","Norway","Sweden","UK","Other"];
const VOLUMES = ["<5k","5-10k","10-15k","15-20k","20-25k",">26k"];
const STATUSES = ["Lab test","RFI","RFQ","Field test","Deployment","Won","Lost"];
const SALESPERSONS = ["Arild Westring","Joakim Karlström","Francis Baestaens","Other"];
const PRODUCTS = ["CX30","CX750","E750","HX30","XGS780","PX780","XG6846C","Other"];

const STATUS_COLORS = {
  "Lab test":   { bg: "#E6F1FB", color: "#0C447C", border: "#378ADD" },
  "RFI":        { bg: "#FAEEDA", color: "#633806", border: "#BA7517" },
  "RFQ":        { bg: "#EEEDFE", color: "#3C3489", border: "#7F77DD" },
  "Field test": { bg: "#FBEAF0", color: "#72243E", border: "#D4537E" },
  "Deployment": { bg: "#EAF3DE", color: "#27500A", border: "#639922" },
  "Won":        { bg: "#EAF3DE", color: "#175404", border: "#3B6D11" },
  "Lost":       { bg: "#FCEBEB", color: "#791F1F", border: "#E24B4A" },
};

const emptyForm = { customer: "", salesperson: "", country: "", product: "", volume: "", status: "", comment: "", redmine: "" };

const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "10px 12px",
  border: "1px solid #ddd", borderRadius: 8,
  fontSize: 15, background: "#fff", color: "#111"
};

function Badge({ status }) {
  if (!status) return —;
  const s = STATUS_COLORS[status] || { bg: "#f5f5f5", color: "#444", border: "#ccc" };
  return (
    
      {status}
    
  );
}

function Field({ label, required, children }) {
  return (
    
      
        {label}{required && *}
      
      {children}
    
  );
}

function OpportunityForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || emptyForm);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = !!initial?.id;

  return (
    
      
        ←
        {isEdit ? "Edit opportunity" : "New opportunity"}
      

      
        Customer details
        
          
            <input style={inputStyle} value={form.customer} onChange={e => set("customer", e.target.value)} placeholder="e.g. Acme Corp" />
          
          
            <select style={inputStyle} value={form.country} onChange={e => set("country", e.target.value)}>
              Select country...
              {COUNTRIES.map(c => {c})}
            
          
        
        
          <select style={inputStyle} value={form.salesperson} onChange={e => set("salesperson", e.target.value)}>
            Select sales person...
            {SALESPERSONS.map(s => {s})}
          
        
      

      
        Opportunity details
        
          
            <select style={inputStyle} value={form.product} onChange={e => set("product", e.target.value)}>
              Select product...
              {PRODUCTS.map(p => {p})}
            
          
          
            <select style={inputStyle} value={form.volume} onChange={e => set("volume", e.target.value)}>
              Select volume...
              {VOLUMES.map(v => {v})}
            
          
          
            <select style={inputStyle} value={form.status} onChange={e => set("status", e.target.value)}>
              Select status...
              {STATUSES.map(s => {s})}
            
          
        
      

      
        Additional info
        
          <input style={inputStyle} value={form.redmine} onChange={e => set("redmine", e.target.value)} placeholder="e.g. #1234" />
        
        
          <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 90 }} value={form.comment} onChange={e => set("comment", e.target.value)} placeholder="Notes, actions, next steps..." />
        
      

      
        Cancel
        <button onClick={() => onSave(form)} disabled={saving} style={{ padding: "10px 28px", borderRadius: 8, fontSize: 14, cursor: "pointer", background: "#111", color: "#fff", border: "none", fontWeight: 500 }}>
          {saving ? "Saving..." : isEdit ? "Save changes" : "Create opportunity"}
        
      
    
  );
}

export default function App() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("list");
  const [editRow, setEditRow] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => {
    fetchRows();
  }, []);

  const fetchRows = async () => {
    setLoading(true);
    const { data } = await supabase.from("opportunities").select("*").order("created_at", { ascending: false });
    if (data) setRows(data);
    setLoading(false);
  };

  const handleSave = async (form) => {
    setSaving(true);
    if (view === "add") {
      await supabase.from("opportunities").insert([form]);
    } else {
      await supabase.from("opportunities").update(form).eq("id", editRow.id);
    }
    await fetchRows();
    setSaving(false);
    setView("list");
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(r =>
      (filterStatus === "All" || r.status === filterStatus) &&
      (!q || [r.customer, r.salesperson, r.country, r.product, r.comment, r.redmine].some(v => (v||"").toLowerCase().includes(q)))
    );
  }, [rows, search, filterStatus]);

  const stats = useMemo(() => ({
    total: rows.length,
    byStatus: Object.fromEntries(STATUSES.map(s => [s, rows.filter(r => r.status === s).length])),
  }), [rows]);

  if (view === "add") return <OpportunityForm onSave={handleSave} onCancel={() => setView("list")} saving={saving} />;
  if (view === "edit") return <OpportunityForm initial={editRow} onSave={handleSave} onCancel={() => setView("list")} saving={saving} />;

  const cols = [["Customer","18%"],["Sales person","14%"],["Country","9%"],["Product","9%"],["Volume","8%"],["Status","11%"],["Comment","19%"],["Redmine","7%"],["","5%"]];

  return (
    
      
        Customer opportunities
        <button onClick={() => setView("add")} style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, cursor: "pointer", background: "#111", color: "#fff", border: "none", fontWeight: 500 }}>
          + New opportunity
        
      

      
        {[{ label: "Total", value: stats.total }, ...STATUSES.map(s => ({ label: s, value: stats.byStatus[s] }))].map(({ label, value }) => (
          
            {label}
            {value}
          
        ))}
      

      
        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, width: 200 }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14, width: 150 }}>
          All
          {STATUSES.map(s => {s})}
        
      

      {loading ? (
        Loading...
      ) : (
        
          
            
              
                {cols.map(([h, w]) => (
                  {h}
                ))}
              
            
            
              {filtered.length === 0 && (
                No records found
              )}
              {filtered.map((row, i) => (
                <tr key={row.id} style={{ borderBottom: "1px solid #eee", background: i % 2 === 1 ? "#fafafa" : undefined, cursor: "pointer" }}
                  onClick={() => { setEditRow(row); setView("edit"); }}>
                  {row.customer || —}
                  {row.salesperson}
                  {row.country}
                  {row.product}
                  {row.volume}
                  
                  {row.comment}
                  {row.redmine}
                  ›
                
              ))}
            
          
        
      )}
    
  );
}
```
