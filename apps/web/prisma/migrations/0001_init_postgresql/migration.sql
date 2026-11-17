-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "planTier" TEXT NOT NULL DEFAULT 'internal',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venture" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "prefixCode" TEXT NOT NULL,
    "colorToken" TEXT NOT NULL,
    "statusLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "keys" INTEGER NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalSource" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "importShape" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "partySize" INTEGER NOT NULL,
    "arrivalDate" TEXT NOT NULL,
    "departureDate" TEXT,
    "reservationTime" TEXT,
    "outlet" TEXT,
    "roomType" TEXT,
    "confirmationCode" TEXT,
    "status" TEXT NOT NULL,
    "amountCents" INTEGER,
    "notes" TEXT,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "supplier" TEXT,
    "supplierSku" TEXT,
    "reorderPoint" INTEGER NOT NULL DEFAULT 0,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 7,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialPurchase" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "receivedOn" TEXT NOT NULL,
    "quantityReceived" INTEGER NOT NULL,
    "quantityRemaining" INTEGER NOT NULL,
    "totalCostCents" INTEGER NOT NULL,
    "costPerUnitCents" INTEGER NOT NULL,
    "supplierOrderRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLevel" (
    "materialId" TEXT NOT NULL,
    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryLevel_pkey" PRIMARY KEY ("materialId")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "referenceId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sku" (
    "id" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "retailCents" INTEGER NOT NULL,
    "wholesaleCents" INTEGER NOT NULL,
    "eventCents" INTEGER NOT NULL,
    "unitsOnHand" INTEGER NOT NULL DEFAULT 0,
    "unitsAllocated" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_production',
    "pouredOn" TEXT NOT NULL,
    "unitsPoured" INTEGER NOT NULL,
    "unitsPassedQc" INTEGER NOT NULL DEFAULT 0,
    "unitsRejected" INTEGER NOT NULL DEFAULT 0,
    "yieldPercent" DOUBLE PRECISION,
    "defectReason" TEXT,
    "notes" TEXT,
    "recalledAt" TIMESTAMP(3),
    "recallReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchMaterial" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "quantityUsed" INTEGER NOT NULL,
    "costPerUnitCents" INTEGER NOT NULL,
    "totalCostCents" INTEGER NOT NULL,
    "purchaseLotsJson" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "BatchMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkuBatchLineage" (
    "id" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "unitsAdded" INTEGER NOT NULL,
    "unitsRemaining" INTEGER NOT NULL,
    "cogsPerUnitCents" INTEGER NOT NULL,
    "releasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkuBatchLineage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "netAmountCents" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLineItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "lineTotalCents" INTEGER NOT NULL,

    CONSTRAINT "OrderLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestProfile" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "networkOptIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAppointment" (
    "id" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "guestId" TEXT,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "clientPhone" TEXT,
    "serviceKey" TEXT NOT NULL,
    "serviceTitle" TEXT NOT NULL,
    "durationMinutes" INTEGER,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "appointmentOn" TEXT NOT NULL,
    "startsAtLabel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'booked',
    "notes" TEXT,
    "confirmationCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardTodo" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "dueOn" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardTodo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceEvent" (
    "id" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startsOn" TEXT NOT NULL,
    "endsOn" TEXT,
    "startsAtLabel" TEXT,
    "capacity" INTEGER NOT NULL,
    "ticketPriceCents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "disclosureText" TEXT NOT NULL,
    "hostDisplayName" TEXT NOT NULL DEFAULT 'Jade Experiences',
    "coverTone" TEXT NOT NULL DEFAULT 'slate',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventItineraryItem" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "startsAtLabel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "placeLabel" TEXT,
    "emoji" TEXT,
    "serviceKey" TEXT,
    "durationMinutes" INTEGER,
    "menuPriceCents" INTEGER,
    "category" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventItineraryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketTier" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "quantityAvailable" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TicketTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventVendor" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "roleLabel" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventVendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "tierId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "partySize" INTEGER NOT NULL DEFAULT 1,
    "ticketQuantity" INTEGER NOT NULL DEFAULT 1,
    "amountPaidCents" INTEGER NOT NULL DEFAULT 0,
    "amountDueCents" INTEGER NOT NULL DEFAULT 0,
    "confirmationCode" TEXT,
    "paymentRef" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "paymentBrand" TEXT,
    "paymentLast4" TEXT,
    "paidAt" TIMESTAMP(3),
    "showOnGuestWall" BOOLEAN NOT NULL DEFAULT true,
    "wallName" TEXT,
    "guestNote" TEXT,
    "notes" TEXT,
    "checkedInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorConsent" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "channelScope" TEXT NOT NULL DEFAULT 'email',
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "VendorConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessCrmContact" (
    "id" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "sourceEventId" TEXT,
    "sourceVendorId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "followUpStatus" TEXT NOT NULL DEFAULT 'none',
    "lastInteraction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessCrmContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentAudit" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "channelScope" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "disclosure" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_key_key" ON "Tenant"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Venture_tenantId_key_key" ON "Venture"("tenantId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Venture_tenantId_prefixCode_key" ON "Venture"("tenantId", "prefixCode");

-- CreateIndex
CREATE UNIQUE INDEX "Property_key_key" ON "Property"("key");

-- CreateIndex
CREATE UNIQUE INDEX "RentalSource_propertyId_key_key" ON "RentalSource"("propertyId", "key");

-- CreateIndex
CREATE INDEX "Booking_propertyId_kind_arrivalDate_idx" ON "Booking"("propertyId", "kind", "arrivalDate");

-- CreateIndex
CREATE INDEX "Booking_propertyId_channel_confirmationCode_idx" ON "Booking"("propertyId", "channel", "confirmationCode");

-- CreateIndex
CREATE INDEX "Material_ventureId_name_idx" ON "Material"("ventureId", "name");

-- CreateIndex
CREATE INDEX "MaterialPurchase_materialId_receivedOn_idx" ON "MaterialPurchase"("materialId", "receivedOn");

-- CreateIndex
CREATE INDEX "InventoryMovement_materialId_createdAt_idx" ON "InventoryMovement"("materialId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Sku_ventureId_code_key" ON "Sku"("ventureId", "code");

-- CreateIndex
CREATE INDEX "Batch_ventureId_status_pouredOn_idx" ON "Batch"("ventureId", "status", "pouredOn");

-- CreateIndex
CREATE INDEX "Batch_skuId_status_idx" ON "Batch"("skuId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_ventureId_code_key" ON "Batch"("ventureId", "code");

-- CreateIndex
CREATE INDEX "BatchMaterial_batchId_idx" ON "BatchMaterial"("batchId");

-- CreateIndex
CREATE INDEX "BatchMaterial_materialId_idx" ON "BatchMaterial"("materialId");

-- CreateIndex
CREATE INDEX "SkuBatchLineage_batchId_idx" ON "SkuBatchLineage"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "SkuBatchLineage_skuId_batchId_key" ON "SkuBatchLineage"("skuId", "batchId");

-- CreateIndex
CREATE INDEX "Customer_ventureId_name_idx" ON "Customer"("ventureId", "name");

-- CreateIndex
CREATE INDEX "Order_ventureId_status_idx" ON "Order"("ventureId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Order_ventureId_code_key" ON "Order"("ventureId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "GuestProfile_email_key" ON "GuestProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAppointment_confirmationCode_key" ON "ServiceAppointment"("confirmationCode");

-- CreateIndex
CREATE INDEX "ServiceAppointment_ventureId_appointmentOn_idx" ON "ServiceAppointment"("ventureId", "appointmentOn");

-- CreateIndex
CREATE INDEX "ServiceAppointment_appointmentOn_status_idx" ON "ServiceAppointment"("appointmentOn", "status");

-- CreateIndex
CREATE INDEX "DashboardTodo_tenantId_done_sortOrder_idx" ON "DashboardTodo"("tenantId", "done", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceEvent_slug_key" ON "ExperienceEvent"("slug");

-- CreateIndex
CREATE INDEX "ExperienceEvent_ventureId_startsOn_idx" ON "ExperienceEvent"("ventureId", "startsOn");

-- CreateIndex
CREATE INDEX "EventItineraryItem_eventId_sortOrder_idx" ON "EventItineraryItem"("eventId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TicketTier_eventId_key_key" ON "TicketTier"("eventId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "EventVendor_eventId_businessKey_key" ON "EventVendor"("eventId", "businessKey");

-- CreateIndex
CREATE INDEX "EventRegistration_eventId_status_idx" ON "EventRegistration"("eventId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_eventId_guestId_key" ON "EventRegistration"("eventId", "guestId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_confirmationCode_key" ON "EventRegistration"("confirmationCode");

-- CreateIndex
CREATE INDEX "VendorConsent_vendorId_granted_idx" ON "VendorConsent"("vendorId", "granted");

-- CreateIndex
CREATE UNIQUE INDEX "VendorConsent_registrationId_vendorId_key" ON "VendorConsent"("registrationId", "vendorId");

-- CreateIndex
CREATE INDEX "BusinessCrmContact_ventureId_businessKey_status_idx" ON "BusinessCrmContact"("ventureId", "businessKey", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessCrmContact_ventureId_businessKey_guestId_key" ON "BusinessCrmContact"("ventureId", "businessKey", "guestId");

-- CreateIndex
CREATE INDEX "ConsentAudit_guestId_createdAt_idx" ON "ConsentAudit"("guestId", "createdAt");

-- CreateIndex
CREATE INDEX "ConsentAudit_businessKey_createdAt_idx" ON "ConsentAudit"("businessKey", "createdAt");

-- AddForeignKey
ALTER TABLE "Venture" ADD CONSTRAINT "Venture_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalSource" ADD CONSTRAINT "RentalSource_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialPurchase" ADD CONSTRAINT "MaterialPurchase_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLevel" ADD CONSTRAINT "InventoryLevel_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sku" ADD CONSTRAINT "Sku_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchMaterial" ADD CONSTRAINT "BatchMaterial_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkuBatchLineage" ADD CONSTRAINT "SkuBatchLineage_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkuBatchLineage" ADD CONSTRAINT "SkuBatchLineage_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLineItem" ADD CONSTRAINT "OrderLineItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLineItem" ADD CONSTRAINT "OrderLineItem_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAppointment" ADD CONSTRAINT "ServiceAppointment_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAppointment" ADD CONSTRAINT "ServiceAppointment_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "GuestProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardTodo" ADD CONSTRAINT "DashboardTodo_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceEvent" ADD CONSTRAINT "ExperienceEvent_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventItineraryItem" ADD CONSTRAINT "EventItineraryItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ExperienceEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTier" ADD CONSTRAINT "TicketTier_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ExperienceEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventVendor" ADD CONSTRAINT "EventVendor_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ExperienceEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ExperienceEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "GuestProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "TicketTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorConsent" ADD CONSTRAINT "VendorConsent_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorConsent" ADD CONSTRAINT "VendorConsent_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "EventVendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorConsent" ADD CONSTRAINT "VendorConsent_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "GuestProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessCrmContact" ADD CONSTRAINT "BusinessCrmContact_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessCrmContact" ADD CONSTRAINT "BusinessCrmContact_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "GuestProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessCrmContact" ADD CONSTRAINT "BusinessCrmContact_sourceVendorId_fkey" FOREIGN KEY ("sourceVendorId") REFERENCES "EventVendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentAudit" ADD CONSTRAINT "ConsentAudit_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "GuestProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
