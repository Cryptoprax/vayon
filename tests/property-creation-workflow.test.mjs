import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(file, stubs = {}) {
    const filename = resolve(file), mod = { exports: {} };
    const code = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    new Function('require', 'module', 'exports', code)(name => {
        if (Object.hasOwn(stubs, name))
            return stubs[name];
        if (name === 'server-only')
            return {};
        if (name.startsWith('@/'))
            return load(name.slice(2) + '.ts', stubs);
        if (name.startsWith('.'))
            return load(resolve(dirname(filename), name + '.ts'), stubs);
        return require(name);
    }, mod, mod.exports);
    return mod.exports;
}
const { propertyFormInput, propertyMutationSchema } = load('features/vayon/property/validation/property.ts');
const { PropertyRepository } = load('features/vayon/property/repositories/property.repository.ts');
const savedId = 'a1111111-1111-4111-8111-111111111111';
function validForm() { const form = new FormData(); for (const [key, value] of Object.entries({ title: 'QA property', reference: 'QA-1', propertyType: 'apartment', listingType: 'sale', status: 'available', countryCode: 'US', city: 'Los Angeles', address: '123 Test Street', salePrice: '250000.50', currency: 'USD', area: '1200.5', areaUnit: 'sqft' }))
    form.set(key, value); return form; }
function fixture({ role = 'organization_owner', rpcData = savedId, rpcError = null, authError = null, membershipError = null } = {}) {
    const filters = [], calls = [], revalidated = [];
    const client = { auth: { getUser: async () => ({ data: { user: { id: 'actor' } }, error: authError }) }, from(table) { assert.equal(table, 'workspace_members'); const q = { select() { return q; }, eq(key, value) { filters.push([key, value]); return q; }, async maybeSingle() { return { data: { roles: { code: role } }, error: membershipError }; } }; return q; }, async rpc(name, args) { calls.push({ name, args }); return { data: rpcData, error: rpcError }; } };
    const stubs = { '@/lib/supabase/server': { createSupabaseServerClient: async () => client }, '@/features/onboarding/services/organization.service': { OrganizationService: class {
                async current() { return { id: 'organization' }; }
            } }, '@/features/onboarding/services/workspace.service': { WorkspaceService: class {
                async first() { return { id: 'workspace' }; }
            } }, 'next/cache': { revalidatePath: path => revalidated.push(path) }, 'next/navigation': { redirect: path => { throw new Error('REDIRECT ' + path); } } };
    return { ...load('features/vayon/property/actions/property.actions.ts', stubs), ...load('features/vayon/property/services/property.service.ts', stubs), filters, calls, revalidated, client };
}
test('shared property input retains decimal prices and repeated amenities', () => { const form = validForm(); form.append('amenities', 'pool'); form.append('amenities', 'gym'); form.append('amenities', 'pool'); form.set('customAmenity', 'Roof deck'); const input = propertyFormInput(form); assert.equal(input.salePrice, 250000.5); assert.equal(input.area, 1200.5); assert.deepEqual(input.amenities, ['pool', 'gym', 'custom:Roof deck']); assert.equal(propertyMutationSchema.safeParse(input).success, true); });
test('creation checks current actor in the selected workspace before mutation', async () => { const f = fixture(); assert.equal(await new f.PropertyService().canCreate(), true); assert.deepEqual(f.filters, [['organization_id', 'organization'], ['workspace_id', 'workspace'], ['user_id', 'actor'], ['status', 'active']]); });
test('existing property roles are enforced and auth or membership failures cannot mutate', async () => { for (const role of ['organization_owner', 'organization_admin', 'branch_manager', 'sales_manager'])
    assert.equal(await new (fixture({ role }).PropertyService)().canCreate(), true); for (const options of [{ role: 'agent' }, { role: 'read_only' }, { authError: new Error('expired') }, { membershipError: new Error('query failed') }]) {
    const f = fixture(options);
    await assert.rejects(new f.PropertyService().create(propertyFormInput(validForm())));
    assert.equal(f.calls.length, 0);
} });
test('repository rejects absent or malformed mutation IDs and RPC errors', async () => { for (const rpcData of [null, undefined, '', {}, 'null']) {
    const f = fixture({ rpcData });
    if (rpcData === undefined)
        f.client.rpc = async () => ({ data: undefined, error: null });
    await assert.rejects(new PropertyRepository(f.client, 'organization', 'workspace').create({}), /saved record ID/);
} const f = fixture({ rpcError: new Error('database rejected') }); await assert.rejects(new PropertyRepository(f.client, 'organization', 'workspace').create({}), /database rejected/); });
test('actual action-service-repository chain redirects to returned ID only after successful RPC', async () => { const f = fixture(); await assert.rejects(f.createPropertyAction(validForm()), error => error.message === `REDIRECT /vayon/properties/${savedId}?success=Property%20created`); assert.equal(f.calls.length, 1); assert.equal(f.calls[0].name, 'create_property'); assert.equal(f.calls[0].args.p_workspace_id, 'workspace'); assert.equal(f.calls[0].args.p_input.salePrice, 250000.5); assert.deepEqual(f.revalidated, ['/vayon/properties']); });
test('invalid input and failed mutations return to the form without success redirect', async () => { const invalid = validForm(); invalid.delete('salePrice'); const f = fixture(); await assert.rejects(f.createPropertyAction(invalid), /REDIRECT \/vayon\/properties\/new\?error=/); assert.equal(f.calls.length, 0); for (const options of [{ rpcData: null }, { rpcError: new Error('database rejected') }, { role: 'agent' }]) {
    const failed = fixture(options);
    await assert.rejects(failed.createPropertyAction(validForm()), /REDIRECT \/vayon\/properties\/new\?error=/);
    assert.deepEqual(failed.revalidated, []);
} });
