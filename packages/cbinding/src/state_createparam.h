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

#pragma once
#ifndef GITCG_STATE_CREATEPARAM_H
#define GITCG_STATE_CREATEPARAM_H

#include <v8.h>

#include "object.h"

namespace gitcg {
inline namespace v1_0 {

class StateCreateParam final : public Object {
  void set_attribute(int attribute, v8::Local<v8::Value> value);

public:
  using Object::Object;
  
  void set_attribute(int attribute, int value);
  void set_attribute(int attribute, const std::string& value);

  void set_deck(int who, int character_or_card, const int* deck, int size);
};

}  // namespace v1_0
}  // namespace gitcg

#endif
