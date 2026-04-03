import type { ConstructionMember } from '../schema/construction-graph'
import type { QuantityLine } from '../schema/quantities'
import type { RulePack } from '../schema/rulepacks'

function getFallbackWasteFactor(member: ConstructionMember, rulePack: RulePack) {
  if (member.type === 'sheathing' || member.type === 'subfloor-panel') {
    return rulePack.wasteFactors.sheathing
  }
  if (member.type === 'drywall') return rulePack.wasteFactors.drywall
  if (member.type === 'trim') return rulePack.wasteFactors.trim
  return rulePack.wasteFactors.framing
}

export function buildQuantityLines(
  members: ConstructionMember[],
  rulePack: RulePack,
  options: {
    preserveWallScope?: boolean
  } = {},
): QuantityLine[] {
  const preserveWallScope = options.preserveWallScope ?? false
  const lines = new Map<string, QuantityLine>()

  for (const member of members) {
    const costRule = rulePack.costRules[member.materialCode]
    const wasteFactor = costRule?.defaultWasteFactor ?? getFallbackWasteFactor(member, rulePack)
    const wallKey = preserveWallScope ? member.wallId : 'all-walls'
    const key = [wallKey, member.assemblyId, member.materialCode, member.unit].join(':')
    const existing = lines.get(key)

    if (!existing) {
      lines.set(key, {
        id: key,
        wallId: preserveWallScope ? member.wallId : undefined,
        assemblyId: member.assemblyId,
        rollupKey: preserveWallScope ? `wall:${member.wallId}` : `material:${member.materialCode}`,
        code: member.materialCode,
        label: costRule?.label ?? member.label,
        unit: member.unit,
        quantity: member.quantity,
        wasteFactor,
        totalQuantity: member.quantity * (1 + wasteFactor),
        memberCount: member.count,
        sourceMemberIds: [member.id],
        uniformatCode: costRule?.uniformatCode ?? 'B2010',
        masterformatCode: costRule?.masterformatCode ?? '06 11 00',
        estimatedUnitCost: costRule?.unitCost,
        estimatedTotalCost: costRule
          ? member.quantity * (1 + wasteFactor) * costRule.unitCost
          : undefined,
        currency: costRule?.currency ?? rulePack.currency,
      })
      continue
    }

    existing.quantity += member.quantity
    existing.totalQuantity = existing.quantity * (1 + existing.wasteFactor)
    existing.memberCount += member.count
    existing.sourceMemberIds.push(member.id)

    if (existing.estimatedUnitCost !== undefined) {
      existing.estimatedTotalCost = existing.totalQuantity * existing.estimatedUnitCost
    }
  }

  return Array.from(lines.values()).sort((left, right) => left.label.localeCompare(right.label))
}
