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

#include "object.h"

namespace gitcg {
inline namespace v1_0 {

Object::Object(Environment* environment, v8::Local<v8::Object> instance)
    : env{environment} {
  this->instance.Reset(environment->get_isolate(), instance);
}

v8::Local<v8::Object> Object::get_instance() const {
  return instance.Get(env->get_isolate());
}

}  // namespace v1_0
}  // namespace gitcg
