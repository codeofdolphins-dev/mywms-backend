# MYWMS — Database ERD

> Generated from the Sequelize model definitions in [src/models/](../src/models/) and the
> association graph in [association.js](../src/models/association.js).
> Diagrams use [Mermaid](https://mermaid.js.org/syntax/entityRelationshipDiagram.html) — they render
> natively on GitHub, GitLab, and in VS Code's Markdown preview.

---

## 1. Architecture — two tiers of databases

MYWMS is **multi-tenant with database-per-tenant isolation** ([tenantMenager.service.js](../src/db/tenantMenager.service.js)):

| Tier | Database | Contents | Defined by |
|---|---|---|---|
| **Root / Central** | `mywms` (single) | Tenant registry, cross-company trade documents (RFQ → Quotation → Blanket Order → Indent), inter-company requisitions, product mappings | `defineRootModels()` |
| **Tenant** | one PG database per tenant, created on signup | Everything operational: products, nodes, stores, procurement, inventory, production, sales, costing | `defineTenantModels()` |

```mermaid
flowchart LR
    subgraph ROOT["Root DB — mywms"]
        TN[TenantsName]
        CONN[Connection]
        PM[ProductMapping]
        RFQD[RFQ / Quotation / BPO / Indent]
        ICR[IntercompanyRequisition]
    end

    subgraph T1["Tenant DB — acme"]
        A1[Products, Nodes, Stores]
        A2[PR, PO, GRN, Batches]
    end

    subgraph T2["Tenant DB — globex"]
        B1[Products, Nodes, Stores]
        B2[SO, Outward, Invoice]
    end

    TN --> CONN
    CONN --> PM
    CONN --> RFQD
    CONN --> ICR
    PM -. "buyer_product_id (soft FK)" .-> A1
    PM -. "vendor_product_id (soft FK)" .-> B1
    RFQD -. "central_bpo_id / central_indent_id" .-> A2
    RFQD -. "central_bpo_id / central_indent_id" .-> B2
    ICR -. "buyer_node / seller_node" .-> A1
    ICR -. "buyer_node / seller_node" .-> B1
```

**Key consequence:** any reference that crosses a database boundary is a *soft* foreign key — a plain
integer/string column with **no database-level constraint**. These are listed in [§5](#5-cross-database-soft-references).

Every table carries Sequelize's implicit `id` (PK, auto-increment) plus `createdAt` / `updatedAt`,
except `State` and `District`, which are declared `timestamps: false`.

---

## 2. Root DB ERD

### 2.1 Tenant registry, identity & geography

```mermaid
erDiagram
    TenantsName ||--o| Tenant : "tenant_id"
    TenantsName ||--o{ TenantBusinessFlowMaster : "tenant_id"
    TenantsName ||--o{ Connection : "buyer_tenant"
    TenantsName ||--o{ Connection : "vendor_tenant"
    State ||--o{ District : "state_id (no FK declared)"
    User ||--o{ UserRoles : "userId"
    Role ||--o{ UserRoles : "roleId"
    Role ||--o{ RolePermissions : "roleId"
    Permission ||--o{ RolePermissions : "permissionId"

    TenantsName {
        int id PK
        string tenant UK "db name / tenant slug"
    }
    Tenant {
        int id PK
        int tenant_id FK "-> TenantsName.id"
        string email
        string password
        string companyName
        bool isOwner
        bool status
    }
    TenantBusinessFlowMaster {
        int id PK
        int tenant_id FK "-> TenantsName.id"
        string node_type_code
        int sequence
        bool is_active
    }
    BusinessNodeType {
        int id PK
        string name
        string code UK
        string category
    }
    State {
        int id PK
        string name
    }
    District {
        int id PK
        string name
        int state_id
    }
    User {
        int id PK
        string email UK
        string password
        jsonb name
        enum type "internal|external"
        bool is_owner
    }
    Role {
        int id PK
        string role
        bool is_default
    }
    Permission {
        int id PK
        string permission
    }
    UserRoles {
        int id PK
        int userId FK
        int roleId FK
    }
    RolePermissions {
        int id PK
        int roleId FK
        int permissionId FK
    }
```

`TenantBusinessFlowMaster` has a composite unique index `uniq_tenant_node_type` on
`(tenant_id, node_type_code)`.

### 2.2 Trading partnership & product mapping

`Connection` is the hub of the root DB — it pairs two tenants and every cross-company document
hangs off it.

```mermaid
erDiagram
    TenantsName ||--o{ Connection : "buyer_tenant -> tenant"
    TenantsName ||--o{ Connection : "vendor_tenant -> tenant"
    Connection ||--o{ ProductMapping : "connection_id"
    Connection ||--o{ BlanketOrder : "connection_id (RESTRICT)"
    Connection ||--o{ BpoIndent : "connection_id (RESTRICT)"
    Connection ||--o{ IntercompanyRequisition : "connection_id"

    Connection {
        int id PK
        string buyer_tenant FK "-> TenantsName.tenant"
        string vendor_tenant FK "-> TenantsName.tenant"
        bool connection_status
        enum connection_type "cfa|3pl|super stockist|dealer|distributor|sub-distributor|retail|supplier|pending"
    }
    ProductMapping {
        int id PK
        int connection_id FK
        int buyer_product_id "soft FK -> buyer tenant Product.id"
        int vendor_product_id "soft FK -> vendor tenant Product.id"
    }
```

### 2.3 RFQ → Quotation → Blanket Order → Indent

The full central sourcing pipeline. An RFQ is broadcast by a buyer tenant; vendor tenants answer
with quotations that carry versioned revisions; an accepted revision becomes a Blanket Purchase
Order (BPO); releases against that BPO are Indents, which materialise as a PO in the buyer's tenant
DB and an SO in the vendor's.

```mermaid
erDiagram
    TenantsName ||--o{ RFQ : "buyer_tenant"
    TenantsName ||--o{ RfqQuotation : "vendor_tenant"
    RFQ ||--o{ RFQItem : "rfq_id"
    RFQ ||--o{ RfqQuotation : "rfq_id"
    RfqQuotation ||--o{ RfqQuotationRevision : "quotation_id"
    RfqQuotationRevision ||--o{ RfqQuotationItem : "revision_id"
    RFQItem ||--o{ RfqQuotationItem : "rfq_item_id"
    ProductMapping ||--o| RfqQuotationItem : "product_map_id"
    RfqQuotationRevision ||--o| BlanketOrder : "rfq_quotation_revision_id"
    Connection ||--o{ BlanketOrder : "connection_id"
    BlanketOrder ||--o{ BlanketOrderItem : "bpo_id"
    ProductMapping ||--o{ BlanketOrderItem : "product_mapping_id (RESTRICT)"
    BlanketOrder ||--o{ BpoIndent : "bpo_id"
    Connection ||--o{ BpoIndent : "connection_id"
    BpoIndent ||--o{ BpoIndentItem : "indent_id"
    BlanketOrderItem ||--o{ BpoIndentItem : "bpo_item_id"

    RFQ {
        int id PK
        string rfq_no
        string buyer_tenant FK
        string pr_reference_code
        enum status "draft|open|closed|cancelled"
        enum priority "low|normal|high"
        date submission_deadline
        decimal grand_total
        jsonb meta
    }
    RFQItem {
        int id PK
        int rfq_id FK
        int product_id "soft FK -> buyer tenant Product.id"
        string product_name
        decimal qty
        string uom
        enum price_limit_type "upper_limit|lower_limit"
        decimal price_limit
    }
    RfqQuotation {
        int id PK
        int rfq_id FK
        string vendor_tenant FK
        string buyer_name
        enum status "accept|reject"
        int current_revision_no
        date valid_till
        jsonb meta
    }
    RfqQuotationRevision {
        int id PK
        int quotation_id FK
        int revision_no
        enum status "draft|sent|negotiate|confirmed|pending|closed|cancelled"
        decimal grand_total
        text remarks
    }
    RfqQuotationItem {
        int id PK
        int revision_id FK
        int rfq_item_id FK
        int product_map_id FK
        decimal qty
        decimal offer_price
    }
    BlanketOrder {
        int id PK
        string bpo_no UK
        string pr_reference_code
        int connection_id FK
        int rfq_quotation_revision_id FK
        enum status "draft|active|closed"
        date valid_until
    }
    BlanketOrderItem {
        int id PK
        int bpo_id FK
        int product_mapping_id FK
        decimal total_contracted_qty
        decimal consumed_qty
        decimal remain_contracted_qty
        decimal unit_price
    }
    BpoIndent {
        int id PK
        string indent_no UK
        int bpo_id FK
        int connection_id FK
        int buyer_po_id "soft FK -> buyer tenant PurchasOrder.id"
        int supplier_so_id "soft FK -> vendor tenant SalesOrder.id"
        enum status "draft|confirmed|fulfilled|cancelled"
        int created_by
        decimal grand_total
    }
    BpoIndentItem {
        int id PK
        int indent_id FK
        int bpo_item_id FK
        decimal release_qty
        decimal unit_price
        decimal line_total
    }
```

### 2.4 Inter-company requisitions

A lighter-weight flow than the BPO chain: one tenant's node requisitions stock directly from a
partner tenant's node over an existing `Connection`.

```mermaid
erDiagram
    Connection ||--o{ IntercompanyRequisition : "connection_id"
    IntercompanyRequisition ||--o{ IntercompanyRequisitionItems : "inter_comp_req_id"
    ProductMapping ||--o{ IntercompanyRequisitionItems : "product_mapping_id"

    IntercompanyRequisition {
        int id PK
        string requisition_no UK
        int connection_id FK
        int buyer_node "soft FK -> buyer tenant BusinessNode.id"
        int seller_node "soft FK -> seller tenant BusinessNode.id"
        string title
        text notes
        date required_by_date
        int created_by
        enum status "pending|assign|dispatched|cancelled|return|closed"
        enum priority "low|normal|high"
    }
    IntercompanyRequisitionItems {
        int id PK
        int inter_comp_req_id FK
        int product_mapping_id FK
        decimal qty
        decimal total_damage_qty "reported by buyer at inward"
        decimal total_shortage_qty "reported by buyer at inward"
        string brand
        string category
        string sub_category
    }
```

---

## 3. Tenant DB ERD

The tenant schema is large, so it is split into seven domains. `Product`, `BusinessNode`,
`ManufacturingUnit`, `Batch`, and `User` recur across domains — they are the shared spine.

### 3.1 Identity, access & node assignment

```mermaid
erDiagram
    User ||--o{ UserRoles : "userId"
    Role ||--o{ UserRoles : "roleId"
    Role ||--o{ RolePermissions : "roleId"
    Permission ||--o{ RolePermissions : "permissionId"
    BusinessNode ||--o{ NodeUser : "node_id"
    User ||--o{ NodeUser : "user_id"
    ManufacturingUnit ||--o{ NodeUser : "store_id (SET NULL)"

    User {
        int id PK
        string email UK
        string password
        jsonb name
        string company_name
        string phone_no
        string profile_image
        jsonb address
        string accessToken
        enum type "internal|external"
        bool is_active
        bool is_owner
        jsonb meta
    }
    Role {
        int id PK
        string role
        bool status
        bool is_default
    }
    Permission {
        int id PK
        string permission
    }
    UserRoles {
        int id PK
        int userId FK
        int roleId FK
    }
    RolePermissions {
        int id PK
        int roleId FK
        int permissionId FK
    }
    NodeUser {
        int id PK
        int user_id FK
        int node_id FK
        int store_id FK "-> ManufacturingUnit.id"
        enum department "purchase|sales|both"
        bool isNodeAdmin
    }
```

### 3.2 Organisation structure — nodes, stores, warehouses

`BusinessNode` is the tenant-side hub: nearly every transactional table points at one. Note the two
parallel "store" concepts — `ManufacturingUnit` (the operational RM/FG/production store, commented
in code as *"ManufacturingUnit === Store"*) and the newer, simpler `Store` table.

```mermaid
erDiagram
    BusinessNodeType ||--o{ BusinessNode : "node_type_code -> code"
    TenantBusinessFlow ||--o{ BusinessNode : "tenant_business_flow_id"
    BusinessNode ||--o| NodeDetails : "business_node_id"
    BusinessNode ||--o{ ManufacturingUnit : "business_node_id"
    BusinessNode ||--o{ Store : "node_id"

    BusinessNodeType {
        int id PK
        string name
        string code UK
        string category
    }
    TenantBusinessFlow {
        int id PK
        string node_type_code UK
        int sequence
        bool is_active
    }
    BusinessNode {
        int id PK
        string node_type_code FK "-> BusinessNodeType.code"
        int tenant_business_flow_id FK
        string name
    }
    NodeDetails {
        int id PK
        int business_node_id FK
        string name
        string location
        jsonb address "address, state, district, lat, long"
        string image
        string gst_no
        string license_no
        text desc
        jsonb meta
    }
    ManufacturingUnit {
        int id PK
        int business_node_id FK
        string name UK
        enum store_type "rm_store|fg_store|production"
        string location
        jsonb address
        bool isActive
        jsonb meta
    }
    Store {
        int id PK
        int node_id FK
        string store_name
        string location
        jsonb address
        bool status
    }
```

### 3.3 Product master data

```mermaid
erDiagram
    Brand ||--o{ Product : "brand_id (SET NULL)"
    Vendor ||--o{ Brand : "vendor_id"
    Vendor ||--o{ Product : "linked_vendor (SET NULL)"
    HSN ||--o{ Product : "hsn_code -> hsn_code"
    UnitType ||--o{ Product : "unit_type -> name"
    PackageType ||--o{ Product : "package_type -> name"
    Product ||--o{ CategoryProducts : "product_id"
    Category ||--o{ CategoryProducts : "category_id"
    Category ||--o{ Category : "parent_id (self)"
    Product ||--o{ BOM : "finished_product_id"
    BOM ||--o{ BOMItem : "bom_id"
    Product ||--o{ BOMItem : "raw_product_id"
    UnitType ||--o{ BOM : "output_uom -> name"
    UnitType ||--o{ BOMItem : "uom -> name"

    Product {
        int id PK
        string name
        string sku UK
        string barcode UK
        string hsn_code FK
        int brand_id FK
        int linked_vendor FK
        enum product_type "raw|finished"
        string package_type FK
        string unit_type FK
        string measure
        string description
        int reorder_level
        bool is_active
        bool has_expiry
        int shelf_life
        decimal mrp
        string photo
    }
    Brand {
        int id PK
        string name
        string slug
        int vendor_id FK
        text description
        string logo
        string website
        string origin_country
        bool isActive
    }
    Category {
        int id PK
        string name
        string description
        int parent_id FK "self-referencing"
        bool status
    }
    CategoryProducts {
        int id PK
        int category_id FK
        int product_id FK
    }
    HSN {
        int id PK
        string hsn_code UK "4/6/8 digits"
        decimal default_gst_rate
        decimal cess_rate
        bool is_exempt
        date effective_from
        date effective_to
        bool is_active
        text description
    }
    UnitType {
        int id PK
        string name UK
        bool isActive
    }
    PackageType {
        int id PK
        string name UK
        bool isActive
    }
    Vendor {
        int id PK
        string name
        string tenant "soft FK -> root TenantsName.tenant"
        int linked_business_node_id "soft FK -> partner tenant BusinessNode.id"
        int connection_id "soft FK -> root Connection.id"
        enum type "vendor|buyer"
        string contact_phone
        string contact_email UK
        jsonb address
        string gst_no
        string license_no
        bool is_active
        jsonb meta
    }
    BOM {
        int id PK
        int finished_product_id FK
        string finished_product_barcode
        decimal output_qty
        string output_uom FK
        text desc
        bool is_active
    }
    BOMItem {
        int id PK
        int bom_id FK
        int raw_product_id FK
        decimal required_qty
        string uom FK
    }
```

### 3.4 Procurement — Requisition → Quotation → Purchase Order

```mermaid
erDiagram
    RequisitionCategory ||--o{ Requisition : "requisition_category_id"
    BusinessNode ||--o{ Requisition : "buyer_business_node_id"
    User ||--o{ Requisition : "created_by"
    Requisition ||--o{ RequisitionItem : "requisition_id"
    Product ||--o| RequisitionItem : "product_id"
    Requisition ||--o{ RequisitionSupplier : "requisition_id"
    BusinessNode ||--o{ RequisitionSupplier : "supplier_business_node_id"
    Requisition ||--o| Quotation : "requisition_id"
    Quotation ||--o{ QuotationItem : "quotation_id"
    RequisitionItem ||--o| QuotationItem : "requisition_item_id"
    BusinessNode ||--o{ Quotation : "to_business_node_id"
    User ||--o{ Quotation : "created_by"
    Quotation ||--o| PurchasOrder : "quotation_id"
    Requisition ||--o| PurchasOrder : "requisition_id"
    BusinessNode ||--o{ PurchasOrder : "from_business_node_id"
    User ||--o{ PurchasOrder : "created_by"
    PurchasOrder ||--o{ PurchaseOrderItem : "purchase_order_id"
    Product ||--o{ PurchaseOrderItem : "buyer_product_id"

    RequisitionCategory {
        int id PK
        string name UK
        bool is_active
        text desc
    }
    Requisition {
        int id PK
        string requisition_no UK
        int buyer_business_node_id FK
        int requisition_category_id FK
        int created_by FK
        string title
        text notes
        decimal grandTotal
        enum type "internal|external"
        date required_by_date
        enum price_limit_type "upper_limit|lower_limit"
        enum status "pending|quoted|po_created|cancelled|closed|bpo_created|assign|dispatched"
        enum priority "low|normal|high"
    }
    RequisitionItem {
        int id PK
        int requisition_id FK
        int product_id FK
        string brand
        string category
        string sub_category
        int qty
        decimal price_limit
        text remarks
    }
    RequisitionSupplier {
        int id PK
        int requisition_id FK
        int supplier_business_node_id FK
        enum status "sent|viewed|quoted|accepted|rejected|assign|Waiting_for_dispatched"
    }
    Quotation {
        int id PK
        string quotation_no UK
        int requisition_id FK "unique - one quotation per requisition"
        enum type "internal|external"
        int from_supplier_id
        int to_business_node_id FK
        enum status "draft|submitted|accepted|rejected|expired"
        date valid_till
        int revision_no
        decimal grandTotal
        text note
        int created_by FK
    }
    QuotationItem {
        int id PK
        int quotation_id FK
        int requisition_item_id FK
        decimal offer_price
        decimal tax_percent
        decimal total_price
        text note
    }
    PurchasOrder {
        int id PK
        string po_no UK
        int central_bpo_id "soft FK -> root BlanketOrder.id"
        int central_indent_id "soft FK -> root BpoIndent.id"
        int quotation_id FK
        int requisition_id FK
        int from_business_node_id FK
        int to_supplier_id
        int target_store_id
        enum type "internal|external|bpo_release"
        enum priority "low|medium|high|urgent"
        date required_by
        enum status "draft|sent_to_supplier|waiting_for_poi|poi_received|approved|picking_in_progress|closed|cancelled"
        int created_by FK
        decimal grand_total
        text note
    }
    PurchaseOrderItem {
        int id PK
        int purchase_order_id FK
        int bpo_item_id "soft FK -> root BlanketOrderItem.id"
        int buyer_product_id FK
        decimal qty
        decimal unit_price
        decimal tax_percent
        decimal line_total
    }
```

### 3.5 Sales, dispatch & invoicing

```mermaid
erDiagram
    BusinessNode ||--o{ SalesOrder : "seller_business_node_id"
    SalesOrder ||--o{ SalesOrderItem : "sales_order_id"
    Product ||--o{ SalesOrderItem : "vendor_product_id"
    SalesOrder ||--o{ Outward : "sales_order_id"
    BusinessNode ||--o{ Outward : "seller_business_node_id"
    ManufacturingUnit ||--o{ Outward : "store_id"
    Outward ||--o{ OutwardItem : "outward_id"
    SalesOrderItem ||--o{ OutwardItem : "sales_order_item_id"
    Product ||--o{ OutwardItem : "vendor_product_id"
    OutwardItem ||--o{ OutwardAllocation : "outward_item_id"
    Batch ||--o{ OutwardAllocation : "batch_id"
    Outward ||--o{ Invoice : "outward_id"
    BusinessNode ||--o{ Invoice : "seller_businessNode_id"
    ManufacturingUnit ||--o{ Invoice : "seller_store_id"
    Invoice ||--o{ InvoiceItem : "invoice_id"
    Product ||--o{ InvoiceItem : "seller_product_id"

    SalesOrder {
        int id PK
        string so_no UK
        string source_po_no "buyer's PO number, not an id"
        int central_bpo_id "soft FK -> root BlanketOrder.id"
        int central_indent_id "soft FK -> root BpoIndent.id"
        int seller_business_node_id FK
        int buyer_business_node_id "soft FK - may be a remote node"
        enum type "internal|external|bpo_release"
        enum priority "low|medium|high|urgent"
        jsonb delivery_address
        date required_by
        enum status "draft|waiting_for_approval|approved|assign_fg|closed|cancelled"
        decimal grand_total
        text note
        jsonb meta
    }
    SalesOrderItem {
        int id PK
        int sales_order_id FK
        int vendor_product_id FK
        decimal qty
        decimal unit_price
        decimal line_total
    }
    Outward {
        int id PK
        string outward_no UK
        int sales_order_id FK "when type = external"
        string pr_no "requisition_no, when type = internal"
        int seller_business_node_id FK
        int store_id FK "FG store -> ManufacturingUnit.id"
        int buyer_business_node_id "soft FK - internal node or vendor"
        enum type "internal|external"
        int picker_id
        enum priority "low|normal|high|urgent"
        enum status "pending|picking|picked|cancelled|dispatched|return"
        date required_by
        date dispatch_date
        string invoice_no
        jsonb meta
        text note
    }
    OutwardItem {
        int id PK
        int outward_id FK
        int sales_order_item_id FK
        int vendor_product_id FK
        decimal requested_qty
        decimal dispatch_qty
        decimal total_shortage_qty
        decimal total_damage_qty
        decimal unit_price
    }
    OutwardAllocation {
        int id PK
        int outward_item_id FK
        int product_id
        int batch_id FK
        decimal allocated_qty
        decimal shortage_qty
        decimal damage_qty
        enum status "allocated|picked|dispatched"
    }
    Invoice {
        int id PK
        string invoice_no UK
        string seller_tenant "soft FK -> root TenantsName.tenant"
        int seller_businessNode_id FK
        int seller_store_id FK "-> ManufacturingUnit.id"
        string buyer_tenant "soft FK -> root TenantsName.tenant"
        int buyer_businessNode_id "soft FK - buyer tenant BusinessNode.id"
        int outward_id FK
        date invoice_date
        decimal sub_total
        enum tax_type "intra|inter|noTax"
        decimal total_tax_amount
        decimal discount
        decimal grand_total
    }
    InvoiceItem {
        int id PK
        int invoice_id FK
        int seller_product_id FK
        string seller_product_name
        string seller_product_sku
        int buyer_product_id "soft FK - buyer tenant Product.id"
        string buyer_product_name
        string buyer_product_sku
        string hsn_code
        string batch_no
        date mfg_date
        date expiry_date
        decimal unit_price
        decimal qty
        decimal itemLevel_sub_total
        decimal tax_rate
        decimal tax_amount
        decimal itemLevel_grand_total
    }
```

### 3.6 Inventory — batches, inward (GRN), ledger & transfers

`Batch` is the unit of stock. Every movement either creates a batch, allocates from one, or writes a
ledger entry against one.

```mermaid
erDiagram
    Product ||--o{ Batch : "product_id"
    BusinessNode ||--o{ Batch : "location_id"
    ManufacturingUnit ||--o{ Batch : "store_id"

    User ||--o{ GRN : "created_by (SET NULL)"
    PurchasOrder ||--o{ GRN : "purchase_order -> po_no"
    BusinessNode ||--o{ GRN : "receiver_id"
    ManufacturingUnit ||--o{ GRN : "mfg_unit_id"
    GRN ||--o{ GRNItem : "grn_id"
    PurchaseOrderItem ||--o{ GRNItem : "purchase_order_item_id"
    Product ||--o{ GRNItem : "product_id"
    GRNItem ||--o{ GRNItemBatch : "grn_item_id"

    NodeStockLedger ||--o{ NodeStockLedgerItem : "ledger_id"
    Product ||--o{ NodeStockLedgerItem : "product_id"
    Batch ||--o{ NodeStockLedgerItem : "batch_id"

    User ||--o{ TransferOrder : "created_by"
    TransferOrder ||--o{ TransferOrderItem : "transfer_order_id"
    Product ||--o{ TransferOrderItem : "product_id"
    TransferOrderItem ||--o{ TransferOrderAllocation : "transferOrder_item_id"
    Batch ||--o{ TransferOrderAllocation : "batch_id"

    BusinessNode ||--o{ DirectTransfer : "from_location_id"
    BusinessNode ||--o{ DirectTransfer : "target_location_id"
    ManufacturingUnit ||--o{ DirectTransfer : "from_mfg_unit_id"
    User ||--o{ DirectTransfer : "created_by"
    DirectTransfer ||--o{ DirectTransferItem : "dir_transfer_id"
    Product ||--o{ DirectTransferItem : "product_id"
    DirectTransferItem ||--o{ DirectTransferAllocation : "dir_transfer_item_id"
    Batch ||--o{ DirectTransferAllocation : "batch_id"

    Batch {
        int id PK
        string batch_no
        int product_id FK
        int location_id FK "-> BusinessNode.id"
        int store_id FK "-> ManufacturingUnit.id"
        enum location_type "mfg_unit|business_node"
        decimal available_qty
        decimal reserved_qty
        int reference_id "polymorphic"
        enum reference_type "opening_stock|grn|transfer|others|production"
        enum batch_status "active|quarantine|expired|consumed"
        decimal unit_price
        date mfg_date
        date expiry_date
        date received_date
        bool is_active
    }
    GRN {
        int id PK
        string grn_no UK
        string purchase_order FK "-> PurchasOrder.po_no"
        enum grn_type "purchase|transfer|return"
        int sender_id "soft FK - node, may be remote"
        int receiver_id FK "-> BusinessNode.id"
        int mfg_unit_id FK
        date received_date
        enum status "draft|accepted|cancelled|return"
        jsonb reference
        int created_by FK
    }
    GRNItem {
        int id PK
        int grn_id FK
        int purchase_order_item_id FK
        int product_id FK
        decimal ordered_qty
        decimal shortage_qty
        decimal damage_qty
        decimal received_qty
    }
    GRNItemBatch {
        int id PK
        int grn_item_id FK
        string batch_no "supplier batch no if available"
        decimal received_qty
        decimal damage_qty
        decimal shortage_qty
        date expiry_date
    }
    NodeStockLedger {
        int id PK
        string ledger_no
        enum transaction_type "opening_stock|internal_transfer|external_transfer|others"
        date txn_date
        int from_location_id "polymorphic"
        enum from_location_type "mfg_unit|business_node"
        int to_location_id "polymorphic"
        enum to_location_type "mfg_unit|business_node"
        int reference_id "polymorphic"
        enum reference_type "transfer_order|grn|sales_order|others"
        int created_by
    }
    NodeStockLedgerItem {
        int id PK
        int ledger_id FK
        int product_id FK
        int batch_id FK
        decimal qty
        string unit_type
        decimal unit_price
        decimal total_value
    }
    TransferOrder {
        int id PK
        string transfer_no UK
        enum type "material_issue|production_transfer"
        int from_parent_node_id "polymorphic - optional node"
        int from_location_id "polymorphic"
        enum from_location_type "mfg_unit|business_node"
        int to_parent_node_id "polymorphic - optional node"
        int to_location_id "polymorphic"
        enum to_location_type "mfg_unit|business_node"
        date required_date
        enum status "draft|requested|dispatched|received|returns|cancelled"
        int created_by FK
    }
    TransferOrderItem {
        int id PK
        int transfer_order_id FK
        int product_id FK
        decimal requested_qty
        decimal dispatched_qty
        decimal received_qty
    }
    TransferOrderAllocation {
        int id PK
        int transferOrder_item_id FK
        int batch_id FK
        decimal allocated_qty
        decimal demaged_qty
        decimal shortage_qty
    }
    DirectTransfer {
        int id PK
        string dir_trans_no UK
        int from_location_id FK "-> BusinessNode.id"
        int from_mfg_unit_id FK "-> ManufacturingUnit.id"
        int target_location_id FK "-> BusinessNode.id"
        date transfer_date
        enum status "draft|send|accepted|return|cancelled"
        int created_by FK
    }
    DirectTransferItem {
        int id PK
        int dir_transfer_id FK
        int product_id FK
        decimal total_send_qty
        decimal total_damage_qty
        decimal total_shortage_qty
        bool is_return
    }
    DirectTransferAllocation {
        int id PK
        int dir_transfer_item_id FK
        int batch_id FK
        decimal send_qty
        decimal damage_qty
        decimal shortage_qty
    }
```

**GRN direction semantics** (from the note in [grn.model.js](../src/models/grn.model.js)):

| `grn_type` | Sender side | Receiver side |
|---|---|---|
| `purchase` | `sender_id` = seller | `receiver_id` + `mfg_unit_id` = buyer |
| `transfer` | `sender_id` (+ optionally `mfg_unit_id`) | `receiver_id` |

### 3.7 Production

```mermaid
erDiagram
    BusinessNode ||--o{ ProductionOrder : "business_node_id"
    ManufacturingUnit ||--o{ ProductionOrder : "mfg_location_id"
    Product ||--o{ ProductionOrder : "target_product_id"
    User ||--o{ ProductionOrder : "created_by"
    ProductionOrder ||--o{ ProductionOrderItem : "production_order_id"
    Product ||--o{ ProductionOrderItem : "rm_product_id"
    ProductionOrder ||--o{ ProductionReceipt : "production_order_id"
    ManufacturingUnit ||--o{ ProductionReceipt : "fg_store_id"
    Product ||--o{ ProductionReceipt : "product_id"
    User ||--o{ ProductionReceipt : "created_by"

    ProductionOrder {
        int id PK
        string production_order_no UK
        int business_node_id FK
        int mfg_location_id FK "WIP / production unit"
        int target_product_id FK "finished good"
        decimal planned_qty
        decimal produced_qty
        decimal wasted_qty
        int part
        enum status "draft|planned|in_progress|completed|cancelled"
        date start_date
        date completion_date
        int created_by FK
    }
    ProductionOrderItem {
        int id PK
        int production_order_id FK
        int rm_product_id FK
        decimal required_qty
    }
    ProductionReceipt {
        int id PK
        string receipt_no UK
        int production_order_id FK
        int fg_store_id FK "-> ManufacturingUnit.id"
        int product_id FK
        string batch_no
        decimal send_qty
        decimal received_qty
        decimal dmg_qty
        decimal short_qty
        date mfg_date
        date expiry_date
        text remarks
        enum status "pending|accepted|rejected"
        int created_by FK
    }
```

### 3.8 Cost centre

```mermaid
erDiagram
    BusinessNode ||--o{ CostCategory : "location_id"
    CostCategory ||--o{ CostCategory : "parent_id (self)"
    BusinessNode ||--o{ CostCenter : "location_id"
    ManufacturingUnit ||--o{ CostCenter : "store_id"
    CostCategory ||--o{ CostCenter : "costHead_id"
    CostCategory ||--o{ CostCenter : "costSubHead_id"
    User ||--o{ CostCenter : "creator_id"

    CostCategory {
        int id PK
        string name
        string description
        int parent_id FK "self-referencing"
        int location_id FK "-> BusinessNode.id"
        bool status
    }
    CostCenter {
        int id PK
        string cost_no UK
        int location_id FK "-> BusinessNode.id"
        int store_id FK "-> ManufacturingUnit.id"
        int costHead_id FK "-> CostCategory.id"
        int costSubHead_id FK "-> CostCategory.id"
        int creator_id FK "-> User.id"
        enum type "monthly|onetime|yearly"
        decimal amount
        date cost_date
        string doc_url
        text remarks
    }
```

---

## 4. Document flow — how the pieces connect end to end

```mermaid
flowchart TD
    subgraph BUYER["Buyer tenant DB"]
        PR[Requisition + RequisitionItem]
        RS[RequisitionSupplier]
        QT[Quotation + QuotationItem]
        PO[PurchasOrder + PurchaseOrderItem]
        GRN[GRN + GRNItem + GRNItemBatch]
        BATCH[(Batch)]
        LEDGER[NodeStockLedger]
    end

    subgraph CENTRAL["Root DB — mywms"]
        RFQ[RFQ + RFQItem]
        RQ[RfqQuotation + Revision + Items]
        BPO[BlanketOrder + Items]
        IND[BpoIndent + Items]
        ICREQ[IntercompanyRequisition]
        PMAP[(ProductMapping)]
    end

    subgraph SELLER["Vendor tenant DB"]
        SO[SalesOrder + SalesOrderItem]
        OUT[Outward + OutwardItem + OutwardAllocation]
        INV[Invoice + InvoiceItem]
        SBATCH[(Batch)]
    end

    PR -->|internal| RS
    RS --> QT --> PO
    PR -->|external / central| RFQ
    RFQ --> RQ --> BPO --> IND
    IND -->|buyer_po_id| PO
    IND -->|supplier_so_id| SO
    ICREQ --> SO
    SO --> OUT --> INV
    OUT --> SBATCH
    INV -->|goods arrive| GRN
    GRN --> BATCH --> LEDGER
    PMAP -.->|translates SKUs| RQ
    PMAP -.->|translates SKUs| IND
    PMAP -.->|translates SKUs| ICREQ
```

---

## 5. Cross-database soft references

None of these are enforced by a PostgreSQL foreign key — they span database boundaries and must be
validated in application code.

| From (DB.Table.Column) | To | Meaning |
|---|---|---|
| `root.Connection.buyer_tenant` / `.vendor_tenant` | `root.TenantsName.tenant` | Real FK (same DB), keyed on the tenant slug rather than the id |
| `root.ProductMapping.buyer_product_id` | buyer tenant `Product.id` | SKU translation, buyer side |
| `root.ProductMapping.vendor_product_id` | vendor tenant `Product.id` | SKU translation, vendor side |
| `root.RFQItem.product_id` | buyer tenant `Product.id` | Requested item |
| `root.BpoIndent.buyer_po_id` | buyer tenant `PurchasOrder.id` | Populated once the local PO exists |
| `root.BpoIndent.supplier_so_id` | vendor tenant `SalesOrder.id` | Populated once the local SO exists |
| `root.IntercompanyRequisition.buyer_node` | buyer tenant `BusinessNode.id` | Requesting node |
| `root.IntercompanyRequisition.seller_node` | seller tenant `BusinessNode.id` | Fulfilling node |
| `tenant.Vendor.connection_id` | `root.Connection.id` | Which partnership this vendor record represents |
| `tenant.Vendor.tenant` | `root.TenantsName.tenant` | Partner tenant slug |
| `tenant.Vendor.linked_business_node_id` | partner tenant `BusinessNode.id` | Explicitly documented as cross-tenant in the model comment |
| `tenant.PurchasOrder.central_bpo_id` | `root.BlanketOrder.id` | Only set for `bpo_release` POs |
| `tenant.PurchasOrder.central_indent_id` | `root.BpoIndent.id` | Only set for indent-generated POs |
| `tenant.PurchaseOrderItem.bpo_item_id` | `root.BlanketOrderItem.id` | Contract line the release draws down |
| `tenant.SalesOrder.central_bpo_id` / `.central_indent_id` | `root.BlanketOrder.id` / `root.BpoIndent.id` | Vendor-side mirror of the above |
| `tenant.SalesOrder.source_po_no` | buyer tenant `PurchasOrder.po_no` | Stored as the buyer's **PO number string**, not an id |
| `tenant.SalesOrder.buyer_business_node_id` | buyer tenant `BusinessNode.id` | No association declared |
| `tenant.Outward.buyer_business_node_id` | internal `BusinessNode.id` or a `Vendor` | No association declared |
| `tenant.Outward.pr_no` | `Requisition.requisition_no` | Used when `type = internal` |
| `tenant.GRN.sender_id` | `BusinessNode.id` (possibly remote) | Only `receiver_id` has a declared association |
| `tenant.Invoice.seller_tenant` / `.buyer_tenant` | `root.TenantsName.tenant` | Party slugs |
| `tenant.Invoice.buyer_businessNode_id` | buyer tenant `BusinessNode.id` | No association declared |
| `tenant.InvoiceItem.buyer_product_id` | buyer tenant `Product.id` | Denormalised alongside name and SKU |

### Polymorphic (in-tenant) references

These pair an id column with a discriminator column instead of a foreign key:

| Table | Id column | Discriminator | Targets |
|---|---|---|---|
| `Batch` | `reference_id` | `reference_type` | `opening_stock` \| `grn` \| `transfer` \| `others` \| `production` |
| `NodeStockLedger` | `from_location_id`, `to_location_id` | `from_location_type`, `to_location_type` | `mfg_unit` \| `business_node` |
| `NodeStockLedger` | `reference_id` | `reference_type` | `transfer_order` \| `grn` \| `sales_order` \| `others` |
| `TransferOrder` | `from_location_id`, `to_location_id` | `from_location_type`, `to_location_type` | `mfg_unit` \| `business_node` |

> Note on `Batch`: although `location_type` is a discriminator, the associations do bind
> `location_id → BusinessNode.id` and `store_id → ManufacturingUnit.id` as real FKs.

---

## 6. Table inventory

### Root DB (`mywms`) — 24 tables

`TenantsName`, `Tenant`, `State`, `District`, `User`, `Role`, `Permission`, `UserRoles`,
`RolePermissions`, `BusinessNodeType`, `TenantBusinessFlowMaster`, `Connection`, `ProductMapping`,
`RFQ`, `RFQItem`, `RfqQuotation`, `RfqQuotationRevision`, `RfqQuotationItem`, `BlanketOrder`,
`BlanketOrderItem`, `BpoIndent`, `BpoIndentItem`, `IntercompanyRequisition`,
`IntercompanyRequisitionItems`

### Tenant DB — 54 tables

| Domain | Tables |
|---|---|
| Identity & access | `User`, `Role`, `Permission`, `UserRoles`, `RolePermissions`, `NodeUser` |
| Organisation | `BusinessNodeType`, `TenantBusinessFlow`, `BusinessNode`, `NodeDetails`, `ManufacturingUnit`, `Store` |
| Product master | `Product`, `Brand`, `Category`, `CategoryProducts`, `HSN`, `UnitType`, `PackageType`, `Vendor`, `BOM`, `BOMItem` |
| Procurement | `RequisitionCategory`, `Requisition`, `RequisitionItem`, `RequisitionSupplier`, `Quotation`, `QuotationItem`, `PurchasOrder`, `PurchaseOrderItem` |
| Sales & dispatch | `SalesOrder`, `SalesOrderItem`, `Outward`, `OutwardItem`, `OutwardAllocation`, `Invoice`, `InvoiceItem` |
| Inventory | `Batch`, `GRN`, `GRNItem`, `GRNItemBatch`, `NodeStockLedger`, `NodeStockLedgerItem`, `TransferOrder`, `TransferOrderItem`, `TransferOrderAllocation`, `DirectTransfer`, `DirectTransferItem`, `DirectTransferAllocation` |
| Production | `ProductionOrder`, `ProductionOrderItem`, `ProductionReceipt` |
| Costing | `CostCategory`, `CostCenter` |

### Dormant model files (not registered in `index.model.js`)

These `.model.js` files exist but are never passed to `defineRootModels()` or `defineTenantModels()`,
so **no table is created for them**:

| File | Note |
|---|---|
| [purchaseInvoice.model.js](../src/models/purchaseInvoice.model.js) | Not imported at all |
| [purchaseInvoiceItems.model.js](../src/models/purchaseInvoiceItems.model.js) | Not imported at all |
| [requestOrder.joinModel.js](../src/models/requestOrder.joinModel.js) | Not imported at all |
| [brandProduct.joinModel.js](../src/models/brandProduct.joinModel.js) | Imported but commented out; the `Product ↔ Brand` many-to-many is commented out too — `Product.brand_id` is a plain one-to-many instead |

---

## 7. Naming quirks worth knowing

| Quirk | Detail |
|---|---|
| `PurchasOrder` | Missing "e" — model name, table `PurchasOrders`, and every association alias use this spelling |
| `ManufacturingUnit` vs `Store` | `ManufacturingUnit` is the operational store (`rm_store` / `fg_store` / `production`) and is what `store_id` columns point to across GRN, Outward, Batch, CostCenter, NodeUser, ProductionReceipt. The separate `Store` table is a newer, thinner record linked only to `BusinessNode` |
| `buyer_tenant` / `vendor_tenant` | Marked "Depriciate name" in [connection.model.js](../src/models/main/connection.model.js) — they hold tenant slugs, and the roles are not always literally buyer/vendor |
| `supplier` vs `vendor` | Used interchangeably (see the comment on `BpoIndent.supplier_so_id`) |
| `demaged_qty` | `TransferOrderAllocation` spells it this way; the sibling tables use `damage_qty` / `total_damage_qty` |
| Denormalised strings | `RequisitionItem` and `IntercompanyRequisitionItems` store `brand` / `category` / `sub_category` as free text rather than FKs — the corresponding `belongsTo` associations are commented out |
