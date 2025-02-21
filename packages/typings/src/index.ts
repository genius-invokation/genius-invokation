// Copyright (C) 2024-2025 Guyutongxue
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

export * from "./common_enums";

export {
  Action,
  ActionValidity,
  UseSkillAction,
  PlayCardAction,
  SwitchActiveAction,
  ElementalTuningAction,
  DeclareEndAction,
} from "./gen/action";

export { PreviewData } from "./gen/preview";

export {
  PhaseType as PbPhaseType,
  CardState as PbCardState,
  CharacterState as PbCharacterState,
  EntityState as PbEntityState,
  PlayerState as PbPlayerState,
  SkillInfo as PbSkillInfo,
  State as PbGameState,
  EquipmentType as PbEquipmentType,
} from "./gen/state";

export { Notification } from "./gen/notification";

export {
  CardArea as PbCardArea,
  EntityArea as PbEntityArea,
  PlayerStatus as PbPlayerStatus,
  RemoveCardReason as PbRemoveCardReason,
  SkillType as PbSkillType,
  ChangePhaseEM,
  CreateCardEM,
  CreateCharacterEM,
  CreateEntityEM,
  DamageEM,
  ElementalReactionEM,
  ModifyEntityVarEM,
  PlayerStatusChangeEM,
  RemoveCardEM,
  RemoveEntityEM,
  ResetDiceEM,
  SetWinnerEM,
  StepRoundEM,
  SwitchActiveEM,
  SwitchTurnEM,
  TransferCardEM,
  TransformDefinitionEM,
  SkillUsedEM,
  PlayerFlag as PbPlayerFlag,
  SetPlayerFlagEM,
} from "./gen/mutation";
export {
  ActionRequest,
  ActionResponse,
  ChooseActiveRequest,
  ChooseActiveResponse,
  RerollDiceRequest,
  RerollDiceResponse,
  SelectCardRequest,
  SelectCardResponse,
  SwitchHandsRequest,
  SwitchHandsResponse,
} from "./gen/rpc";

import { Request as RpcRequest, Response as RpcResponse } from "./gen/rpc";
import { ExposedMutation as PbExposedMutation } from "./gen/mutation";

type Calculated<T> = { [K in keyof T]: T[K] } & {};

export type OneofBase = { $case: string; value: object } | undefined;
export type OneofCase<T extends OneofBase> = NonNullable<T>["$case"];
export type ExtractOneof<T extends OneofBase, K extends OneofCase<T>> = (T & {
  $case: K;
  value: unknown;
})["value"];
export type FlattenOneof<T extends OneofBase> = {
  [K in NonNullable<T>["$case"]]: Calculated<
    {
      $case: K;
    } & ExtractOneof<T, K>
  >;
}[NonNullable<T>["$case"]];

export type RpcMethod = OneofCase<RpcRequest["request"]>;
export type RpcRequestPayloadOf<Method extends RpcMethod> = ExtractOneof<
  RpcRequest["request"],
  Method
>;
export type RpcResponsePayloadOf<Method extends RpcMethod> = ExtractOneof<
  RpcResponse["response"],
  Method
>;

export function createRpcRequest<const Method extends RpcMethod>(
  method: Method,
  value: NoInfer<RpcRequestPayloadOf<Method>>,
): RpcRequest {
  return { request: { $case: method, value } } as any;
}
export function createRpcResponse<const Method extends RpcMethod>(
  method: Method,
  value: NoInfer<RpcResponsePayloadOf<Method>>,
): RpcResponse {
  return { response: { $case: method, value } } as any;
}
export type RpcDispatcher = {
  [K in RpcMethod]: (
    payload: RpcRequestPayloadOf<K>,
  ) => Promise<RpcResponsePayloadOf<K>>;
};
export function dispatchRpc(
  dispatcher: RpcDispatcher,
): (req: RpcRequest) => Promise<RpcResponse> {
  return async (req) => {
    const { $case, value } = req.request!;
    const handler = dispatcher[$case];
    if (!handler) {
      throw new Error(`Unknown RPC method: ${$case}`);
    }
    const response = await handler(value as any);
    return createRpcResponse($case, response);
  };
}

export function flattenPbOneof<T extends OneofBase>({
  $case,
  value,
}: NonNullable<T>): FlattenOneof<T> {
  return { $case, ...value } as FlattenOneof<T>;
}
export function unFlattenOneof<T extends OneofBase>(
  flatten: FlattenOneof<T>,
): T {
  const { $case, ...value } = flatten;
  return { $case, value } as unknown as T;
}

export { RpcRequest, RpcResponse };
export { PbExposedMutation };
export type ExposedMutation = FlattenOneof<PbExposedMutation["mutation"]>;
