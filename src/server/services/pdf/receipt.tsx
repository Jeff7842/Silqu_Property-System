import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { formatKES } from "@/lib/money";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 12, fontFamily: "Helvetica" },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 4, color: "#0F2D52" },
  muted: { color: "#6B7280", marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { color: "#6B7280" },
  total: { fontSize: 16, fontWeight: 700, marginTop: 16, color: "#0F2D52" },
});

export type ReceiptData = {
  orgName: string;
  receiptNo: string;
  tenantName: string;
  unitLabel: string;
  propertyName: string;
  method: string;
  reference: string | null;
  paidAt: Date;
  amountCents: number;
};

function ReceiptDocument({ data }: { data: ReceiptData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{data.orgName}</Text>
        <Text style={styles.muted}>Payment receipt · {data.receiptNo}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Tenant</Text>
          <Text>{data.tenantName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Unit</Text>
          <Text>{data.propertyName} — {data.unitLabel}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text>{new Intl.DateTimeFormat("en-KE", { dateStyle: "long" }).format(data.paidAt)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Method</Text>
          <Text>{data.method}</Text>
        </View>
        {data.reference && (
          <View style={styles.row}>
            <Text style={styles.label}>Reference</Text>
            <Text>{data.reference}</Text>
          </View>
        )}

        <Text style={styles.total}>Amount paid: {formatKES(data.amountCents)}</Text>
      </Page>
    </Document>
  );
}

export function renderReceiptPdf(data: ReceiptData): Promise<Buffer> {
  return renderToBuffer(<ReceiptDocument data={data} />);
}
