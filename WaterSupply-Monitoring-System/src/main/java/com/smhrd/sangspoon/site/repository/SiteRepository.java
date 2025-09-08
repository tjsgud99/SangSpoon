package com.smhrd.sangspoon.site.repository;

import com.smhrd.sangspoon.site.entity.SiteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SiteRepository extends JpaRepository<SiteEntity, String> {
    // 기본 CRUD 메서드는 JpaRepository에서 제공
    @Query("select distinct s.managementCode from SiteEntity s where s.managementCode is not null")
    List<String> findAllManagementCodes();
}
