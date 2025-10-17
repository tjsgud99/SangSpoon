# SangSpoon


## 프로젝트 소개
> 2025.07.16 ~ 2025.08.27
> 기업 연계 프로젝트(광워프)
>
> - Java 기반의 Spring Boot와 리액트를 활용하여 상수도 상태를 실시간으로 확인하고 효율적으로 관리할수 있는 웹 기반 통합 모니터링 시스템 구축<br>
> - 현장 센서/설비의 데이터 프로토콜을 통해 수집 데이터를 표준화하고 백엔드와 연동<br>
> - 수집 데이터의 전터리 및 DB 저장 구조를 설계하여 데이터 품질과 조회 성능 확보<br>
> - 기간, 구역, 지표별 통계 제공과 차트 시각화를 통해 운영 인사이트와 의사결정 지원> 이상데이터 감지 및 실시간 이메일 알림으로 신속한 운영 대응 지원<br>

## 팀원
김선형, 김영훈, 최정운, 양진성
<br>

## 시스템 흐름도
<img width="1920" height="1080" alt="sangspoon" src="https://github.com/user-attachments/assets/5b1d57e2-d9b8-4d88-a63b-e9f737061dba" />

> 사용자(Front, React)가 로그인/회원가입, 현장 CRUD, 그래프 조회, PDF 요청, 지도 보기 등을 수행<br>
> - Spring Boot API가 요청 받아 인증/권한, 현장 관리, 데이터 조회/PDF 생성 처리<br>
> - 센서 스케줄러가 등록된 현장별로 랜덤 값을 데이터 프로토콜 형식으로 생성 -> 원본(sensor_data)과 파싱(parsed_data)을 MariaDB에 저장<br>
> - 이상치 발생 시 EmailAlertService가 설정된 이메일로 알림 발송<br>
> - Front는 카카오 지도 API로 현장 좌표를 지도에 표시<br>
> - 사용자는 현장별 그래프.상태 확인 및 PDF 다운로드 가능<br>

## ER-Diagram
<img width="2070" height="842" alt="er" src="https://github.com/user-attachments/assets/652417bc-a6b6-4178-9d4d-b8347ebf0046" />
