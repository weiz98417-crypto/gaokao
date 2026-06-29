import type { ICityUniversityRepository } from '../repositories/interfaces';

/**
 * 城市-院校映射服务层
 *
 * 封装城市与院校 ID 之间的双向查询，供推荐引擎的地域偏好过滤使用。
 */
export class CityUniversityService {
  constructor(private readonly repo: ICityUniversityRepository) {}

  /**
   * 按城市名列表查询该城市内的所有院校 ID
   * @param cityNames 城市名列表（如 ['北京', '广州']）
   * @returns 大学 ID 列表（去重）
   */
  async getUniversityIdsByCities(cityNames: string[]): Promise<string[]> {
    if (!cityNames || cityNames.length === 0) {
      return [];
    }
    return this.repo.getByCities(cityNames);
  }

  /**
   * 批量查询院校所在城市
   * @param universityIds 大学 ID 列表
   * @returns Map<universityId, cityName>
   */
  async getCitiesByUniversityIds(
    universityIds: string[]
  ): Promise<Map<string, string>> {
    if (!universityIds || universityIds.length === 0) {
      return new Map();
    }
    return this.repo.getCitiesByUniversityIds(universityIds);
  }
}
