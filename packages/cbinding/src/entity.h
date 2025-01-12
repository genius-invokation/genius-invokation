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
#ifndef GITCG_ENTITY_H
#define GITCG_ENTITY_H

#include <v8.h>

#include "object.h"

namespace gitcg {
inline namespace v1_0 {

class Entity final : public Object {
  template <std::size_t N>
  int get_property(const char (&prop)[N]) const {
    auto isolate = env->get_isolate();
    auto handle_scope = v8::HandleScope(isolate);
    return get<v8::Number>(prop)->Value();
  }

public:
  using Object::Object;

  int get_type() const {
    return get_property("type");
  }

  int get_definition_id() const {
    return get_property("definitionId");
  }

  int get_id() const {
    return get_property("id");
  }

  int get_variable(const std::string& name) const;

};

}
}

#endif
