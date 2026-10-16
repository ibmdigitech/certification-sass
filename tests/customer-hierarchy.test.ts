import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

function uniqueString(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

describe('Customer, Site and Asset Hierarchy Tests (Phase B)', () => {
  let company: any;
  let customer: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    company = await prisma.company.create({
      data: {
        name: uniqueString('Co-AssetTest'),
        prefix: 'AST',
        subscriptionPlan: 'Enterprise',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should create a customer with multiple sites and equipment assets under company isolation', async () => {
    // 1. Create Customer with business fields
    customer = await prisma.customer.create({
      data: {
        companyId: company.id,
        name: 'Al Habtoor Engineering LLC',
        code: 'CUST-HBTR-01',
        contact: 'Engineer Tariq',
        email: uniqueString('tariq') + '@habtoor.com',
        phone: '+97143456789',
        status: 'active',
        creditTerms: '30 Days',
        trnNumber: '100234567800003',
      },
    });

    expect(customer.id).toBeDefined();
    expect(customer.status).toBe('active');

    // 2. Create Multiple Sites for this customer
    const siteDubai = await prisma.customerSite.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        name: 'Dubai Marina Tower Site',
        code: 'SITE-DXB-01',
        emirate: 'Dubai',
        address: 'Al Marsa Street, Dubai Marina',
        contactPerson: 'Site Manager Tariq',
        contactPhone: '+971501112233',
      },
    });

    const siteAbuDhabi = await prisma.customerSite.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        name: 'Yas Island Development Site',
        code: 'SITE-AUH-01',
        emirate: 'Abu Dhabi',
        address: 'Yas Island Sector 4',
        contactPerson: 'Site Manager Zaid',
        contactPhone: '+971502223344',
      },
    });

    expect(siteDubai.id).toBeDefined();
    expect(siteAbuDhabi.id).toBeDefined();

    // 3. Register Multiple Equipment Assets under Customer & Sites
    const asset1 = await prisma.customerAsset.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        siteId: siteDubai.id,
        assetType: 'Mobile Crane',
        make: 'Liebherr',
        model: 'LTM 1100',
        serialNumber: uniqueString('SN-CRANE'),
        registrationNumber: 'DXB-HE-9842',
        capacity: '100 Tons',
        yearOfManufacture: 2021,
        status: 'active',
      },
    });

    const asset2 = await prisma.customerAsset.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        siteId: siteDubai.id,
        assetType: 'Forklift',
        make: 'Toyota',
        model: '8FGU25',
        serialNumber: uniqueString('SN-FORK'),
        registrationNumber: 'DXB-FL-1049',
        capacity: '2.5 Tons',
        yearOfManufacture: 2022,
        status: 'active',
      },
    });

    const asset3 = await prisma.customerAsset.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        siteId: siteAbuDhabi.id,
        assetType: 'Passenger Hoist',
        make: 'Alimak',
        model: 'Scando 650',
        serialNumber: uniqueString('SN-HOIST'),
        registrationNumber: 'AUH-PH-3321',
        capacity: '2000 kg',
        yearOfManufacture: 2020,
        status: 'active',
      },
    });

    expect(asset1.assetType).toBe('Mobile Crane');
    expect(asset2.assetType).toBe('Forklift');
    expect(asset3.siteId).toBe(siteAbuDhabi.id);

    // 4. Verify querying Customer includes full hierarchy
    const fetchedCustomer = await prisma.customer.findUnique({
      where: { id: customer.id },
      include: {
        sites: { include: { assets: true } },
        assets: true,
      },
    });

    expect(fetchedCustomer).not.toBeNull();
    expect(fetchedCustomer!.sites).toHaveLength(2);
    expect(fetchedCustomer!.assets).toHaveLength(3);
  });
});
