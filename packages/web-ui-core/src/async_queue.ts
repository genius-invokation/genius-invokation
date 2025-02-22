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

type Task<T = unknown> = () => Promise<T>;

export class AsyncQueue {
  private queue: Task[] = [];
  private isProcessing: boolean = false;

  push<T>(task: Task<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const taskWithPromise = async () => {
        try {
          const ret = await task();
          resolve(ret);
        } catch (error) {
          reject(error);
        }
      };

      this.queue.push(taskWithPromise);
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    this.isProcessing = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      await task();
    }
    this.isProcessing = false;
  }
}
