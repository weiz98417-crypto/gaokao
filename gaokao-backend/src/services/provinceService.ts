import type { Province } from '../types';
import type { IProvinceRepository } from '../repositories/interfaces';

/**
 * 省份配置服务层
 */
export class ProvinceService {
  constructor(private readonly repository: IProvinceRepository) {}

  /**
   * 获取全部省份配置
   * @returns 省份列表
   */
  async getAll(): Promise<Province[]> {
    return Promise.resolve(this.repository.getAll());
  }
}
